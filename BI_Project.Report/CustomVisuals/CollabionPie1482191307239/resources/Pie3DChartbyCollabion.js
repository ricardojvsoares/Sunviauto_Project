var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var CollabionPie1482191307239;
        (function (CollabionPie1482191307239) {
            CollabionPie1482191307239.collabionChartsMessagesAndTooltips = {
                sliceTooltip: {
                    percentage: 'Percentage',
                    filtered: 'Highlighted',
                    filteredPercentageOfSlice: 'Percentage of slice highlighted',
                    filteredPercentageOfActual: 'Percentage of total highlighted',
                }
            };
            CollabionPie1482191307239.collabionChartsGeneralProperty = {
                colorPalette: {
                    setOf5: ['#1276c1', '#26ad60', '#ffb42d', '#f15b1e', '#8d040b'],
                    setOf10: ['#1177bf', '#27ae61', '#8dba39', '#ffa82d', '#f05a1d', '#be2e14', '#8d040b', '#5b0206']
                },
                highlightSettings: {
                    defaultHighlightColor: '#56bacc',
                    minimumOpacity: 0.2,
                    borderColor: '#2f2f2f',
                    borderWidth: 0.4
                }
            };
            CollabionPie1482191307239.pieChartProps = {
                general: {
                    formatString: { objectName: 'general', propertyName: 'formatString' },
                },
                dataPoint: {
                    fill: { objectName: 'dataPoint', propertyName: 'fill' }
                },
            };
            CollabionPie1482191307239.datastd = {};
            CollabionPie1482191307239.indexMappingSlicePosition = {
                elementAt90: -1,
                elementAt270: -1,
                leftStartIndex: -1,
                leftEndIndex: -1,
                rightStartIndex: -1,
                rightEndIndex: -1
            };
            CollabionPie1482191307239.angleCoveredBySlice = {
                angleCoveredBy90: 0,
                angleCoveredBy270: 0,
            };
            var CollabionPie = (function () {
                function CollabionPie() {
                    this.innerRadius = 0;
                    this.firstTimeRender = true;
                    this.renderGlassPie = false;
                    this.previousDataLength = 0;
                    this.durationAnimations = 600;
                }
                CollabionPie.converter = function (dataView, colors) {
					var slices = [];
                    var highlightedSlice = [];
                    var formatStringProp = CollabionPie1482191307239.pieChartProps.general.formatString;
                    var categorical = dataView.categorical;
                    var categories = categorical.categories || [];
                    var values = categorical.values;
                    var valueMetaData = [];
                    if (values) {
                        valueMetaData = _.map(values, function (v) {
                            return v.source;
                        });
                    }
                    var hasHighlights = values && values.length > 0 && values[0] && !!values[0].highlights;
                    var hasNegativeValues = false, hasZeroValues = false, isAllValuesNegative = false, isAllValuesZero = true;
                    var value,rotationStatus=true;
                    var categoryLabels = [];
                    var dataLabelsSettings = visuals.dataLabelUtils.getDefaultLabelSettings(true);
                    var colorHelper = new visuals.ColorHelper(colors, CollabionPie1482191307239.pieChartProps.dataPoint.fill, CollabionPie.defaultDataPointColor);
                    var dataForPieLayout = [];
                    var pieLayoutData = [], pieLayout;
                    CollabionPie.total = 0;
					dataLabelsSettings.fontSize=15;
					if (dataView && dataView.metadata && dataView.metadata.objects) {
                        var labelsObj = dataView.metadata.objects['labels'];
                        if (labelsObj)
                            visuals.dataLabelUtils.updateLabelSettingsFromLabelsObject(labelsObj, dataLabelsSettings);
                    }
                    // Always take the first valid value field
                    var firstValueColumn = !_.isEmpty(values) && CollabionPie.getFirstValidValueColumn(values);
                    var orginalValueColumn=[];
					// If we don't have a valid value column, just return
					if (!firstValueColumn) {
                        return {
                            slices: slices,
                            highlightedSlice: highlightedSlice,
                            hasHighlights: hasHighlights,
                            showDataLabels: true,
                            dataLabelsSettings: dataLabelsSettings,
                            hasNegativeValues: hasNegativeValues,
                            hasZeroValues: hasZeroValues,
                            isAllValuesNegative: isAllValuesNegative,
                            pieThickness: 30,
                            slicedOutPieIndex: -1,
                            rotationStatus: false
                        };
                    }
                    if (categories.length === 1) {
                        var category = categories[0];
                        var categoryValues = category.values;
                        CollabionPie.labels = categoryValues;
                        var categorySourceFormatString = visuals.valueFormatter.getFormatString(category.source, formatStringProp);
                        isAllValuesNegative = true;
						if(firstValueColumn.values.length>200){
							return "ExcessData";
						}
						for (var i = 0; i < firstValueColumn.values.length; i++) {
							orginalValueColumn[i] = firstValueColumn.values[i]; 
						}
                        for (var i = 0; i < categoryValues.length; i++) {
                            if (firstValueColumn.values[i] > 0) {
                                isAllValuesNegative = false;
                                break;
                            }
                        }
                        for (var i = 0; i < categoryValues.length; i++) {
                            if (firstValueColumn.values[i] == 0) {
                                hasZeroValues = true;
                                value = 0;
                            }
                            else if (firstValueColumn.values[i] < 0) {
                                hasNegativeValues = true;
                                if (isAllValuesNegative) {
                                    value = Math.abs(firstValueColumn.values[i]);
								}
                                else {
                                    value = 0;
								}
                            }
                            else {
                                value = firstValueColumn.values[i];
                            }
                            CollabionPie.total += value;
                        }
                        for (var i = 0; i < categoryValues.length; i++) {
                            dataForPieLayout[i] = isAllValuesNegative ?Math.abs(firstValueColumn.values[i]): firstValueColumn.values[i] <0 ? 0 : firstValueColumn.values[i];
							if (firstValueColumn.values[i] != 0) {
                                isAllValuesZero = false;
                            }
                        }
                        pieLayout = d3.layout.pie().sort(null);
                        if (!isAllValuesZero) {
							pieLayoutData = pieLayout(dataForPieLayout);
						}
						else {
                            return null;
                        }
						var isSmallerPalette = categoryValues.length <= CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf5.length;
                        for (var i = 0, ilen = categoryValues.length; i < ilen; i++) {
                            var measureName = firstValueColumn.source.queryName;
                            var identity = visuals.SelectionIdBuilder.builder().withCategory(category, i).withMeasure(measureName).createSelectionId();
                            value = firstValueColumn.values[i];
                            var percentage = (Math.abs(value) / CollabionPie.total);
                            var formattedCategoryValue = visuals.valueFormatter.format(categoryValues[i], categorySourceFormatString);
                            var formattedPercentage = visuals.valueFormatter.format(isAllValuesNegative||value > 0 ? percentage : 0, '0.00 %;-0.00 %;0.00 %');
                            var tooltipInfo;
                            rotationStatus = !rotationStatus?false :  percentage==1 ? false :true; 
							tooltipInfo = [];
                            tooltipInfo = visuals.TooltipBuilder.createTooltipInfo(formatStringProp, categorical, formattedCategoryValue, orginalValueColumn[i]);
                            tooltipInfo.push({
                                displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.percentage,
                                value: formattedPercentage
                            });
                            var color = colorHelper.getColorForMeasure(category.objects && category.objects[i], '');
                            if (color == CollabionPie.defaultDataPointColor) {
                                color = colors.getColorByIndex(i).value;
                                if (isSmallerPalette)
                                    color = CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf5[i % CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf5.length];
                                else
                                    color = CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf10[i % CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf10.length];
                            }
                            var colorRGB = d3.rgb(color);
                            var pieColor = {
                                baseColor: color,
                                rightSurfaceColor: colorRGB.darker(CollabionPie.rightSurfaceDarknessFactor).toString(),
                                leftSurfaceColor: colorRGB.darker(CollabionPie.leftSurfaceDarknessFactor).toString(),
                                outerSurfaceColor: colorRGB.darker(CollabionPie.outerSurfaceDarknessFactor).toString(),
                                topSurfaceColor: colorRGB.darker(CollabionPie.topSurfaceDarknessFactor).toString()
                            };
                            slices.push({
                                labeltext: formattedCategoryValue + ', ' + formattedPercentage,
                                value: value,
                                categoryOrMeasureIndex: i,
                                identity: identity,
                                key: identity.getKey(),
                                startAngle: pieLayoutData[i].startAngle,
                                endAngle: pieLayoutData[i].endAngle,
                                midAngle: pieLayoutData[i].startAngle > pieLayoutData[i].endAngle ? (pieLayoutData[i].startAngle + (CollabionPie.angle360 - pieLayoutData[i].startAngle + pieLayoutData[i].endAngle) / 2) % CollabionPie.angle360 : ((pieLayoutData[i].endAngle - pieLayoutData[i].startAngle) / 2) + pieLayoutData[i].startAngle,
                                selected: false,
                                tooltipInfo: tooltipInfo,
                                color: pieColor,
                            });
                            if (hasHighlights) {
                                var highlightIdentity = visuals.SelectionId.createWithHighlight(identity);
                                var highlight = firstValueColumn.highlights[i];
                                var highlightedValue = highlight !== 0 ? highlight : undefined;
								var tooltipInfo;
                                var percentageHighlight = (Math.abs(highlight) / Math.abs(value));
                                var percentageActualHighlight = (Math.abs(highlight) / Math.abs(CollabionPie.total));
                                tooltipInfo.push({
                                    displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.filtered,
                                    value: highlight ? highlight : 0
                                });
                                tooltipInfo.push({
                                    displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.filteredPercentageOfSlice,
                                    value: visuals.valueFormatter.format(percentageHighlight, '0.00 %;-0.00 %;0.00 %')
                                });
                                tooltipInfo.push({
                                    displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.filteredPercentageOfActual,
                                    value: visuals.valueFormatter.format(percentageActualHighlight, '0.00 %;-0.00 %;0.00 %')
                                });
                                highlightedSlice.push({
                                    labeltext: formattedCategoryValue + ', ' + formattedPercentage,
                                    value: value,
                                    categoryOrMeasureIndex: i,
                                    identity: highlightIdentity,
                                    key: highlightIdentity.getKey(),
                                    startAngle: pieLayoutData[i].startAngle,
                                    endAngle: pieLayoutData[i].endAngle,
                                    midAngle: pieLayoutData[i].startAngle > pieLayoutData[i].endAngle ? (pieLayoutData[i].startAngle + (CollabionPie.angle360 - pieLayoutData[i].startAngle + pieLayoutData[i].endAngle) / 2) % CollabionPie.angle360 : ((pieLayoutData[i].endAngle - pieLayoutData[i].startAngle) / 2) + pieLayoutData[i].startAngle,
                                    selected: false,
                                    highlight: true,
                                    highlightValue: highlightedValue,
                                    tooltipInfo: tooltipInfo,
                                    color: pieColor,
                                });
                            }
                        }
                    }
                    else if (valueMetaData.length > 0 && values && values.length > 0) {
                        if(values.length>200){
							return "ExcessData";
						}
						isAllValuesNegative = true;
						for (var i = 0; i < values.length; i++) {
						orginalValueColumn[i] = values[i].values[0]; 
						}
                        for (var i = 0; i < values.length; i++) {
                            if (values[i].values[0] > 0) {
                                isAllValuesNegative = false;
                                break;
                            }
                        }
                        for (var i = 0, len = values.length; i < len; i++) {
                            if (values[i].values[0] == 0) {
                                hasZeroValues = true;
                                value = 0;
                            }
                            else if (values[i].values[0] < 0) {
                                hasNegativeValues = true;
                                if (isAllValuesNegative) {
                                    value = Math.abs(values[i].values[0]);
								}
                                else {
                                    value = 0;
								}
                            }
                            else {
                                value = values[i].values[0];
                            }
                            CollabionPie.total += value;
                        }
                        for (var i = 0, len = values.length; i < len; i++) {
                            var valueColumn = values[i];
                            dataForPieLayout[i] = isAllValuesNegative ? Math.abs(valueColumn.values[0]) : valueColumn.values[0]<0 ? 0 : valueColumn.values[0];
							if (valueColumn.values[0] != 0) {
                                isAllValuesZero = false;
                            }
                        }
                        pieLayout = d3.layout.pie().sort(null);
						if (!isAllValuesZero) {
							pieLayoutData = pieLayout(dataForPieLayout);
						}
						else {
                            return null;
                        }
                        var isSmallerPalette = values.length <= CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf5.length;
                        for (var i = 0, len = values.length; i < len; i++) {
                            var valueColumn = values[i];
                            if (!CollabionPie.isValidValueColumn(valueColumn))
                                continue;
                            value = valueColumn.values[0];
                            if (value < 0)
                                hasNegativeValues = true;
                            var percentage = (Math.abs(value) / CollabionPie.total);
                            var identity = visuals.SelectionId.createWithMeasure(valueColumn.source.queryName);
                            var categoryValue = valueMetaData[i].displayName;
                            var valueIndex = categorical.categories ? null : i;
                            rotationStatus = !rotationStatus?false :  percentage==1 ? false :true; 
							var tooltipInfo;
                            tooltipInfo = [];
                            CollabionPie.labels = categoryValue;
                            var color = colorHelper.getColorForMeasure(valueColumn.source.objects, '');
                            if (color == CollabionPie.defaultDataPointColor) {
                                color = colors.getColorByIndex(i).value;
                                if (isSmallerPalette)
                                    color = CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf5[i % CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf5.length];
                                else
                                    color = CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf10[i % CollabionPie1482191307239.collabionChartsGeneralProperty.colorPalette.setOf10.length];
                            }
                            var formattedPercentage = visuals.valueFormatter.format(value > 0 ? percentage : 0, '0.00 %;-0.00 %;0.00 %');
                            tooltipInfo = visuals.TooltipBuilder.createTooltipInfo(formatStringProp, categorical, categoryValue, orginalValueColumn[i]);
                            tooltipInfo.push({
                                displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.percentage,
                                value: formattedPercentage
                            });
                            var colorRGB = d3.rgb(color);
                            var pieColor = {
                                baseColor: color,
                                rightSurfaceColor: colorRGB.darker(CollabionPie.rightSurfaceDarknessFactor).toString(),
                                leftSurfaceColor: colorRGB.darker(CollabionPie.leftSurfaceDarknessFactor).toString(),
                                outerSurfaceColor: colorRGB.darker(CollabionPie.outerSurfaceDarknessFactor).toString(),
                                topSurfaceColor: colorRGB.darker(CollabionPie.topSurfaceDarknessFactor).toString()
                            };
                            slices.push({
                                labeltext: valueMetaData[i].displayName + ', ' + formattedPercentage,
                                value: value,
                                categoryOrMeasureIndex: i,
                                identity: identity,
                                selected: false,
                                key: identity.getKey(),
                                startAngle: pieLayoutData[i].startAngle,
                                endAngle: pieLayoutData[i].endAngle,
                                midAngle: pieLayoutData[i].startAngle > pieLayoutData[i].endAngle ? (pieLayoutData[i].startAngle + (CollabionPie.angle360 - pieLayoutData[i].startAngle + pieLayoutData[i].endAngle) / 2) % CollabionPie.angle360 : ((pieLayoutData[i].endAngle - pieLayoutData[i].startAngle) / 2) + pieLayoutData[i].startAngle,
                                tooltipInfo: tooltipInfo,
                                color: pieColor,
                            });
                            if (hasHighlights) {
                                var highlightIdentity = visuals.SelectionId.createWithHighlight(identity);
                                var highlight = valueColumn.highlights[0];
                                highlight = highlight == null ? 0 : highlight;
                                var percentageHighlight = (Math.abs(highlight) / Math.abs(value));
                                var percentageActualHighlight = (Math.abs(highlight) / Math.abs(PyramidChartCollabion.total));
                                var tooltipInfo;
                                tooltipInfo.push({
                                    displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.filtered,
                                    value: highlight ? highlight : 0
                                });
                                tooltipInfo.push({
                                    displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.filteredPercentageOfSlice,
                                    value: visuals.valueFormatter.format(percentageHighlight, '0.00 %;-0.00 %;0.00 %')
                                });
                                tooltipInfo.push({
                                    displayName: CollabionPie1482191307239.collabionChartsMessagesAndTooltips.sliceTooltip.filteredPercentageOfActual,
                                    value: visuals.valueFormatter.format(percentageActualHighlight, '0.00 %;-0.00 %;0.00 %')
                                });
                                highlightedSlice.push({
                                    labeltext: valueMetaData[i].displayName + ', ' + formattedPercentage,
                                    value: value,
                                    categoryOrMeasureIndex: i,
                                    identity: highlightIdentity,
                                    key: highlightIdentity.getKey(),
                                    startAngle: pieLayoutData[i].startAngle,
                                    endAngle: pieLayoutData[i].endAngle,
                                    midAngle: pieLayoutData[i].startAngle > pieLayoutData[i].endAngle ? (pieLayoutData[i].startAngle + (CollabionPie.angle360 - pieLayoutData[i].startAngle + pieLayoutData[i].endAngle) / 2) % CollabionPie.angle360 : ((pieLayoutData[i].endAngle - pieLayoutData[i].startAngle) / 2) + pieLayoutData[i].startAngle,
                                    selected: false,
                                    highlight: true,
                                    highlightValue: highlightedValue,
                                    tooltipInfo: tooltipInfo,
                                    color: pieColor,
                                });
                            }
                        }
                    }
                    return {
                        slices: slices,
                        highlightedSlice: highlightedSlice,
                        hasHighlights: hasHighlights,
                        dataLabelsSettings: dataLabelsSettings,
                        showDataLabels: true,
                        hasNegativeValues: hasNegativeValues,
                        pieThickness: 30,
                        slicedOutPieIndex: -1,
                        rotationStatus: rotationStatus
                    };
                };
                CollabionPie.isValidValueColumn = function (value) {
                    return value.source.isMeasure;
                };
                CollabionPie.getFirstValidValueColumn = function (values) {
                    for (var i = 0; i < values.length; i++) {
                        if (values[i].source.isMeasure)
                            return values[i];
                    }
                };
                CollabionPie.prototype.init = function (options) {
                    this.options = options;
                    var element = options.element;
                    this.currentViewport = options.viewport;
                    CollabionPie.angle180 = Math.PI;
                    CollabionPie.angle360 = 2 * CollabionPie.angle180;
                    CollabionPie.angle270 = CollabionPie.angle180 + CollabionPie.angle180 / 2;
                    CollabionPie.angle90 = CollabionPie.angle180 / 2;
                    this.margin = {
                        left: 5,
                        right: 5,
                        top: 0,
                        bottom: 0
                    };
                    var style = options.style;
                    this.colors = style.colorPalette.dataColors;
                    CollabionPie.defaultDataPointColor = this.colors.getColorByIndex(0).value;
                    this.hostServices = options.host;
                    this.selectionManager = new visuals.utility.SelectionManager({ hostServices: options.host });
                    this.interactivityService = visuals.createInteractivityService(this.hostServices);
                };
                CollabionPie.prototype.updateViewportProperties = function () {
                    var viewport = this.currentViewport;
                    this.svg.attr('width', viewport.width).attr('height', viewport.height);
                    this.rx = viewport.width / 3;
                    this.ry = viewport.height / 4;
                    this.cx = viewport.width / 2;
                    this.cy = viewport.height / 2;
                    this.ry = this.ry < this.rx / 3 ? this.ry : this.rx / 3;
                    this.rx = this.ry * 3;
                    CollabionPie.linearGradientForPie = { x1: -0.91 * this.rx, y1: 100, x2: 0.82 * this.rx, y2: 100 };
                    CollabionPie.radialGradientForPie = { cx: 0.1 * this.rx, cy: 3.3 * this.ry, fx: -0.1 * this.rx, fy: 0.9 * this.ry, r: 3.15 * this.rx };
                    this.data.pieThickness = 60;
                    this.data.pieThickness = (this.ry / 1.8) < (this.rx / 4) ? this.ry / 1.8 : this.rx / 4;
                    this.data.pieThickness = this.data.pieThickness < 60 ? this.data.pieThickness : 60;
                    this.renderChart = true;
                    this.textRy = this.ry + 2 * this.data.pieThickness;
                    this.textRx = this.rx + this.data.pieThickness;
                    this.pie.attr("transform", "translate(" + this.cx + "," + (this.cy - this.data.pieThickness / 2) + ")");
                };
                CollabionPie.prototype.oneTimeSVGInitialization = function () {
                    this.updatedPieData = [];
                    var slices = this.data.slices;
                    var currentScope;
                    this.dataPointsLength = slices.length;
                    this.updatePieLayoutData();
                    currentScope = this;
					if(this.svg!=null || this.svg!= undefined){
						d3.select("svg").remove();
					}
                    this.svg = d3.select(this.options.element.get(0)).append('svg').attr("width", this.currentViewport.width).attr("height", this.currentViewport.height).classed(CollabionPie.VisualClassName, true);
                    this.chart = this.svg.append('g');
                    this.defs = this.chart.append('defs');
                    var drag = d3.behavior.drag().on("dragstart", function () { return function () {
                        d3.event.preventDefault();
                        if (d3.event.sourceEvent.stopPropagation)
                            d3.event.sourceEvent.stopPropagation();
                        else
                            d3.event.sourceEvent.cancelBubble = true;
                        d3.select(this).classed("dragging", true);
                    }; }).on("drag", function () { return currentScope.rotation(currentScope); }).on("dragend", function () { return function () {
                        d3.select(this).classed("dragging", false);
                    }; });
                    this.pie = this.chart.append("g").attr("transform", "translate(" + this.currentViewport.width / 2 + "," + this.currentViewport.height / 2 + ")").attr("class", "slices").call(drag);
                    this.outer = this.pie.append("g").attr("class", "Side_Outer");
                };
                CollabionPie.prototype.reInitializationOfSvgPaths = function () {
                    var currentScope = this;
                    var slices = this.data.slices;
                    this.dataPointsLength = slices.length;
                    if (this.outerSurface) {
                        this.outer.selectAll(".outer").remove();
					if(this.outer.select(".error"))
						this.outer.select(".error").remove();
                    }
                    if (this.top) {
                        this.pie.selectAll(".Top").remove();
                    }
                    this.outerSurface = this.outer.selectAll("g").data(this.updatedPieData).enter().append("g").attr("class", "outer").attr("pieIndex", function (d, i) {
                        return currentScope.updatedPieData[i].index;
                    }).on("click", function () {
                        
                            currentScope.elementReposition(this);
                    });
                    //left side
                    this.outerSurface.append("path").attr("pos", "first").attr("index", function (d, i) {
                        return i;
                    });
                    //outer
                    this.outerSurface.append("path").attr("pos", "second").attr("index", function (d, i) {
                        return i;
                    });
                    //right side
                    this.outerSurface.append("path").attr("pos", "third").attr("index", function (d, i) {
                        return i;
                    });
                    if (this.data.dataLabelsSettings.show === true && typeof this.data.showDataLabels !== "undefined" && slices.length > 0) {
                        this.addLabel();
                        this.outerSurface.append("text").attr("class", "label").attr("x", null).attr("y", null).text(null).attr("text-anchor", null);
                        //path for outer surface edge gradient
                        this.outerSurface.append("path").attr("class", "outerEdgeGradientPath").attr("index", function (d, i) {
                            return currentScope.updatedPieData[i].index;
                        });
                        this.outerSurface.append("path").attr("class", "pointingLine").attr("d", null).attr("fill", "none").attr("stroke-width", 0.5).attr("stroke", "#000000");
                        this.outerSurface.append("path").attr("class", "outerEdge").attr("d", null).attr("fill", "none").attr("stroke", "#000000");
                    }
                    //top Surface
                    this.top = this.pie.append("g").attr("class", "Top").selectAll("g").data(slices).enter().append("g").attr("pieIndex", function (d, i) {
                        return i;
                    }).on("click", function () {
                            currentScope.elementReposition(this);
                    });
                    this.top.append("path").attr("class", "topSurface").attr("d", "");
                    //path for top edge gradient
                    this.top.append("path").attr("class", "topEdge").attr("d", "");
                };
                /* Update is called for data updates, resizes & formatting changes */
                CollabionPie.prototype.update = function (options) {
                    var check;
                    this.data = {
                        slices: [],
                        highlightedSlice: [],
                        hasHighlights: false,
                        showDataLabels: true,
                        dataLabelsSettings: visuals.dataLabelUtils.getDefaultLabelSettings(),
                        hasNegativeValues: false,
                        hasZeroValues: false,
                        isAllValuesNegative: false,
                        pieThickness: 30,
                        slicedOutPieIndex: -1,
                        rotationStatus: false
                    };
                    check = this.data.slices;
					var dataViews = this.dataViews = options.dataViews;
                    this.currentViewport = options.viewport;
                    if (dataViews && dataViews.length > 0) {
                        var dataView = dataViews[0];
                        if (dataView.categorical) {
                            this.data = CollabionPie.converter(dataView, this.colors);
							if (this.data == null || this.data.slices!=undefined && this.data.slices.length==0) {
                                this.clearPiePath();
                                return;
                            }
							else if(this.data== "ExcessData"){
								if(this.svg!=null || this.svg!= undefined)
									this.clearPiePath();
								this.displayError();
								return;
								
							}
							this.data.slices[this.data.slices.length - 1 ].endAngle= CollabionPie.angle360;
                            if (this.interactivityService) {
                                this.interactivityService.applySelectionStateToData(this.data.slices);
                            }
						}
                    }
					if (this.data.slices.length > 0 && dataView.categorical.values) {
                        var categoryValues = dataView.categorical.values;
                        if (categoryValues.length > 1) {
                            if (this.previousDataLength < categoryValues.length) {
                                this.data.reDraw = true;
                                this.previousDataLength = categoryValues.length;
                            }
                            else
                                this.data.reDraw = false;
                        }
                        else {
                            if (this.previousDataLength != categoryValues[0].values.length) {
                                this.data.reDraw = true;
                                this.previousDataLength = categoryValues[0].values.length;
                            }
                            else
                                this.data.reDraw = false;
                        }
                        if (dataView.categorical.categories) {
                            this.textProperties = {
                                text: CollabionPie.labels[0] ? CollabionPie.labels[0] : "default",
                                fontFamily: visuals.dataLabelUtils.StandardFontFamily,
                                fontSize: visuals.NewDataLabelUtils.LabelTextProperties.fontSize
                            };
                            this.textHeight = powerbi.TextMeasurementService.measureSvgTextHeight(this.textProperties);
                            this.avgTextWidth = powerbi.TextMeasurementService.measureSvgTextWidth(this.textProperties) / this.textProperties.text.length;
                        }
                        this.draw();
                    }
					else{
						this.clearPiePath();
					}
                };
                CollabionPie.prototype.clearPiePath = function () {
                    var currentScope;
                    currentScope = this;
                    if(currentScope.outerSurface){
						if (currentScope.outerSurface.select("g")) {
							var outerPath = currentScope.outerSurface.select("g");
							outerPath.selectAll("path").attr("d", " ");
						}
						if (currentScope.outerSurface.selectAll("path").attr("d"))
							currentScope.outerSurface.selectAll("path").attr("d", " ");
						if (currentScope.outerSurface.select("text"))
							currentScope.outerSurface.select("text").text(null);
					}
					if (currentScope.top){
						if (currentScope.top.select("g")) {
							var topPath = currentScope.top.select("g");
							topPath.selectAll("path").attr("d", " ");
						}
						
						if (currentScope.top.selectAll("path").attr("d"))
							currentScope.top.selectAll("path").attr("d", null);
					}
                };
				
				CollabionPie.prototype.displayError = function () {
					var error="Chart could not be displayed as data set has more than 200 plotting points.";
					var measureText="Chart";
					var textSvgLength=0;
					var textMeasure=powerbi.TextMeasurementService.measureSvgTextWidth(measureText);
					
					if(this.svg!=null || this.svg!= undefined){
						d3.select("svg").remove();
					}
					this.svg = d3.select(this.options.element.get(0)).append('svg').attr("width", this.currentViewport.width).attr("height", this.currentViewport.height).classed(CollabionPie.VisualClassName, true);
					this.chart = this.svg.append('g');
					this.pie = this.chart.append("g").attr("transform", "translate(" + this.currentViewport.width / 2 + "," + this.currentViewport.height / 2 + ")").attr("class", "slices");
					this.outer = this.pie.append("g").attr("class", "Side_Outer");
					var display= this.outer.append("g").attr("class", "outer").append("text").attr("class", "error").attr("x", 0).attr("y", 0).text(error).style("font-size", 20).attr("text-anchor", "middle");
					textSvgLength=(textMeasure/6)*error.length;
					if(textSvgLength>this.currentViewport.width){
						display.attr("textLength","100%").attr("lengthAdjust","spacingAndGlyphs");
					}
					this.firstTimeRender=true;	
					this.previousDataLength=0;
					
				};
				
                CollabionPie.prototype.draw = function () {
					var currentScope = this;
                    if (this.firstTimeRender == true) {
                        this.oneTimeSVGInitialization();
                        this.firstTimeRender = false;
                    }
                    this.updatedPieData = [];
                    this.updateViewportProperties();
                    this.updatePieLayoutData();
                    if (this.data.reDraw == true || this.updatedPieData.length==this.data.slices.length && this.previousDataLength != this.data.slices.length || this.previousDataLength != this.updatedPieData.length) {
                        for (var i = 0; i < this.data.slices.length; i++) {
                            this.data.slices[i].clicked = "null";
                        }
                        if (this.data.hasHighlights) {
                            this.clearPiePath();
                            this.reInitializationOfSvgPaths();
                            this.updatePieLayoutData();
                            this.updateHighlightedSliceObject();
                            this.calculateFilteredSlicePosition();
                            this.drawFilteredPie();
                            this.drawOuterGlassPie();
                        }
                        else {
							this.reInitializationOfSvgPaths();
						}
						this.data.reDraw = false;
                    }
                    else {
                        if (this.data.hasHighlights) {
                            this.clearPiePath();
                            this.reInitializationOfSvgPaths();
                            this.updatePieLayoutData();
                            this.updateHighlightedSliceObject();
                            this.calculateFilteredSlicePosition();
                            this.drawFilteredPie();
                            this.drawOuterGlassPie();
                        }
                        else {
                            this.renderGlassPie = false;
                            this.clearPiePath();
							this.reInitializationOfSvgPaths();
                        }
                    }
                    if (visuals.TooltipManager) {
                        visuals.TooltipManager.addTooltip(currentScope.outerSurface, function (tooltipEvent) {
                            var index = tooltipEvent.data.categoryOrMeasureIndex == undefined ? tooltipEvent.data.index : tooltipEvent.data.categoryOrMeasureIndex;
                            var categoryIndex = parseInt(d3.select(currentScope.outerSurface[0][index]).attr("pieIndex"));
                            //Pie slices are update inside init method properly, currently hovered slice id can be fetched from tooltipEvent and the id is then matched with pie slice data
                            //TooltipInfo of Pie Slice is then returned instead of tooltipEvent's TooltipInfo as TooltipInfo contains the old Tooltip if slices are not redrawn 
                            return currentScope.data.slices.filter(function (value, index, array) { return value.categoryOrMeasureIndex == categoryIndex; })[0].tooltipInfo;
                        }, true);
                        visuals.TooltipManager.addTooltip(currentScope.top, function (tooltipEvent) {
                            //Pie slices are update inside init method properly, currently hovered slice id can be fetched from tooltipEvent and the id is then matched with pie slice data
                            //TooltipInfo of Pie Slice is then returned instead of tooltipEvent's TooltipInfo as TooltipInfo contains the old Tooltip if slices are not redrawn 
                            return currentScope.data.slices.filter(function (value, index, array) { return value.categoryOrMeasureIndex == tooltipEvent.data.categoryOrMeasureIndex; })[0].tooltipInfo;
                        }, true);
                    }
                    if (!this.data.hasHighlights)
                        this.updateSlicePath();
					
                };
                CollabionPie.prototype.pieTop = function (data) {
                    var currentScope = this;
                    var sx, sy, ex, ey, diff, startAngle, endAngle, singleElement, edgeLightDistance;
                    var top = [];
                    var edgeLight = [];
					startAngle = data.startAngle;
                    endAngle = data.endAngle;
                    if (startAngle == null || endAngle == null) {
                        top.push(null);
                        edgeLight.push(null);
                        return {
                            pieTop: top.join(" "),
                            pieTopEdgeLight: edgeLight.join(" "),
                        };
                    }
                    diff = endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle;
                    edgeLightDistance = 0.05 * currentScope.data.pieThickness;
                    var rx = (currentScope.rx).toString();
                    var ry = (currentScope.ry).toString();
                    if (endAngle - startAngle === 0) {
                        top.push("M", "0", "0");
                        edgeLight.push("M", "0", "0");
                    }
                    else {
                        sx = currentScope.rx * Math.cos(startAngle);
                        sy = currentScope.ry * Math.sin(startAngle);
                        ex = currentScope.rx * Math.cos(endAngle);
                        ey = currentScope.ry * Math.sin(endAngle);
                        top.push("M", (this.innerRadius * ex).toString(), (this.innerRadius * ey).toString(), "L", sx, sy, "A", rx, ry, "0", (diff > CollabionPie.angle180 ? "1" : "0"), (diff > CollabionPie.angle360 ? "0" : "1"), ex, ey, "Z");
                        if (startAngle < CollabionPie.angle180 && endAngle > startAngle || startAngle > CollabionPie.angle180 && endAngle < startAngle) {
                            startAngle = startAngle > CollabionPie.angle180 ? 0 : startAngle;
                            endAngle = endAngle > CollabionPie.angle180 ? CollabionPie.angle180 : endAngle;
                            singleElement = true;
                        }
                        else if (startAngle < CollabionPie.angle180 && endAngle < startAngle) {
                            singleElement = false;
                        }
                        if (singleElement == true) {
                            sx = (this.rx * Math.cos(startAngle));
                            sy = (this.ry * Math.sin(startAngle));
                            ex = (this.rx * Math.cos(endAngle));
                            ey = (this.ry * Math.sin(endAngle));
                            edgeLight.push("M", sx, sy, "A", rx, ry, "0", ((endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle) > CollabionPie.angle180 ? "1" : "0"), "1", ex, ey, "L", ex, (ey - edgeLightDistance).toString(), "A", rx, ry, "0", ((endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle) > CollabionPie.angle180 ? "1" : "0"), "0", sx, (sy - edgeLightDistance).toString(), "Z");
                        }
                        else if (singleElement == false) {
                            sx = (this.rx * Math.cos(startAngle));
                            sy = (this.ry * Math.sin(startAngle));
                            ex = (this.rx * Math.cos(CollabionPie.angle180));
                            ey = (this.ry * Math.sin(CollabionPie.angle180));
                            edgeLight.push("M", sx, sy, "A", rx, ry, "0", ((CollabionPie.angle180 < startAngle ? CollabionPie.angle360 + CollabionPie.angle180 - startAngle : CollabionPie.angle180 - startAngle) > CollabionPie.angle180 ? "1" : "0"), "1", ex, ey, "L", ex, (ey - edgeLightDistance).toString(), "A", rx, ry, "0", ((CollabionPie.angle180 < startAngle ? CollabionPie.angle360 + CollabionPie.angle180 - startAngle : CollabionPie.angle180 - startAngle) > CollabionPie.angle180 ? "1" : "0"), "0", sx, (sy - edgeLightDistance).toString(), "Z");
                            sx = (this.rx * Math.cos(0));
                            sy = (this.ry * Math.sin(0));
                            ex = (this.rx * Math.cos(endAngle));
                            ey = (this.ry * Math.sin(endAngle));
                            edgeLight.push("M", sx, sy, "A", rx, ry, "0", ((endAngle < 0 ? CollabionPie.angle360 + endAngle - 0 : endAngle - 0) > CollabionPie.angle180 ? "1" : "0"), "1", ex, ey, "L", ex, (ey - edgeLightDistance).toString(), "A", rx, ry, "0", ((endAngle < 0 ? CollabionPie.angle360 + endAngle - 0 : endAngle - 0) > CollabionPie.angle180 ? "1" : "0"), "0", sx, (sy - edgeLightDistance).toString(), "Z");
                        }
                        
                    }
					return {
                            pieTop: top.join(" "),
                            pieTopEdgeLight: edgeLight.join(" "),
                        };
                };
                CollabionPie.prototype.pieBottom = function (data) {
                    var currentScope = this;
                    var sx, sy, ex, ey, diff, startAngle, endAngle;
                    var bottom = [];
                    startAngle = data.startAngle;
                    endAngle = data.endAngle;
                    if (startAngle == null) {
                        bottom.push(null);
                        return bottom.join(" ");
                    }
                    diff = endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle;
                    var rx = (currentScope.rx).toString();
                    var ry = (currentScope.ry).toString();
                    if (endAngle - startAngle === 0) {
                        bottom.push("M", "0", "0");
                    }
                    else {
                        sx = (currentScope.rx * Math.cos(startAngle));
                        sy = (currentScope.ry * Math.sin(startAngle));
                        ex = (currentScope.rx * Math.cos(endAngle));
                        ey = (currentScope.ry * Math.sin(endAngle));
                        bottom.push("M", sx, sy + this.data.pieThickness, "A", rx, ry, "0", (diff > CollabionPie.angle180 ? "1" : "0"), (diff > CollabionPie.angle360 ? "0" : "1"), ex, ey + this.data.pieThickness, "L", (this.innerRadius * ex).toString(), ((this.innerRadius * ey) + this.data.pieThickness).toString(), "L", sx, sy + this.data.pieThickness);
                        
                    }
					return bottom.join(" ");
                };
                CollabionPie.prototype.pieOuter = function (data) {
                    var currentScope = this;
                    var sx, sy, ex, ey, startAngle, endAngle, singleElement, edgeLightDistance;
                    var rx = (currentScope.rx).toString();
                    var ry = (currentScope.ry).toString();
                    var pieOuter = [];
                    var outerEdgeLight = [];
                    if (data.startAngle == null) {
                        pieOuter.push(null);
                        outerEdgeLight.push(null);
                        return {
                            pieOuterEdgeLight: outerEdgeLight.join(" "),
                            pieOuter: pieOuter.join(" "),
                        };
                    }
                    edgeLightDistance = (0.05 * currentScope.data.pieThickness);
                    if (currentScope.data.hasHighlights && currentScope.data.drawGlassSurface) {
                        startAngle = data.startAngle >= CollabionPie.angle180 ? (data.startAngle > data.endAngle ? CollabionPie.angle360 : 0) : data.startAngle;
                        endAngle = data.endAngle > CollabionPie.angle180 ? (data.startAngle > data.endAngle || data.startAngle < CollabionPie.angle180 ? CollabionPie.angle180 : 0) : data.endAngle;
                    }
                    else {
                        startAngle = data.startAngle > data.endAngle ? CollabionPie.angle360 : data.startAngle;
                        endAngle = ((data.startAngle < CollabionPie.angle180 && data.endAngle > CollabionPie.angle180 || data.startAngle > data.endAngle && data.endAngle > CollabionPie.angle180) ? CollabionPie.angle180 : data.endAngle);
                    }
                    if (endAngle - startAngle === 0) {
                        pieOuter.push("M", "0", "0");
                        outerEdgeLight.push("M", "0", "0");
                    }
                    else {
                        sx = (this.rx * Math.cos(startAngle));
                        sy = (this.ry * Math.sin(startAngle));
                        ex = (this.rx * Math.cos(endAngle));
                        ey = (this.ry * Math.sin(endAngle));
                        pieOuter.push("M", sx, sy + this.data.pieThickness, "A", rx, ry, "0", ((endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle) > CollabionPie.angle180 ? "1" : "0"), "1", ex, ey + this.data.pieThickness, "L", ex, ey, "A", rx, ry, "0", ((endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle) > CollabionPie.angle180 ? "1" : "0"), "0", sx, sy, "Z");
                        if (startAngle < CollabionPie.angle180 && endAngle > startAngle || startAngle > CollabionPie.angle180 && endAngle < startAngle) {
                            startAngle = startAngle > CollabionPie.angle180 ? 0 : startAngle;
                            endAngle = endAngle > CollabionPie.angle180 ? CollabionPie.angle180 : endAngle;
                            sx = (this.rx * Math.cos(startAngle));
                            sy = (this.ry * Math.sin(startAngle));
                            ex = (this.rx * Math.cos(endAngle));
                            ey = (this.ry * Math.sin(endAngle));
                            outerEdgeLight.push("M", sx, sy, "A", rx, ry, "0", ((endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle) > CollabionPie.angle180 ? "1" : "0"), "1", ex, ey, "L", ex, (ey + edgeLightDistance).toString(), "A", rx, ry, "0", ((endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle) > CollabionPie.angle180 ? "1" : "0"), "0", sx, (sy + edgeLightDistance).toString(), "Z");
                        }
                    }
                    return {
                        pieOuterEdgeLight: outerEdgeLight.join(" "),
                        pieOuter: pieOuter.join(" "),
                    };
                };
                CollabionPie.prototype.pieSide = function (data, side) {
                    var startAngle, endAngle, sx, sy, ex, ey, ret = [];
                    startAngle = data.startAngle;
                    endAngle = data.endAngle;
                    if (startAngle == null) {
                        ret.push(null);
                        return ret.join(" ");
                    }
                    sx = ((this.rx) * Math.cos(startAngle));
                    sy = ((this.ry) * Math.sin(startAngle));
                    ex = ((this.rx) * Math.cos(endAngle));
                    ey = ((this.ry) * Math.sin(endAngle));
                    if (this.dataPointsLength === 1) {
                        return "M 0 0";
                    }
                    else {
                        if (side === "left") {
                            ret.push("M", ex, ey, "L", ex, ey + this.data.pieThickness, "L", this.innerRadius * ex, ((this.innerRadius * ey) + this.data.pieThickness), "L", this.innerRadius * ex, this.innerRadius * ey);
                        }
                        if (side === "right") {
                            ret.push("M", sx, sy, "L", sx, sy + this.data.pieThickness, "L", this.innerRadius * sx, ((this.innerRadius * sy) + this.data.pieThickness), "L", this.innerRadius * sx, this.innerRadius * sy);
                        }
                        
                    }
					return ret.join(" ");
                };
                CollabionPie.prototype.translateTo = function (data, index, clicked) {
                    var slices = this.data.slices, startAngle, endAngle, sx, sy, mx, my, cntrX, cntrY, distance, ratio, xVal, yVal;
                    startAngle = data.startAngle;
                    endAngle = data.endAngle;
                    sx = this.rx * Math.cos(startAngle);
                    sy = this.ry * Math.sin(startAngle);
                    mx = this.rx * Math.cos(slices[index].midAngle);
                    my = this.ry * Math.sin(slices[index].midAngle);
                    cntrX = this.innerRadius * mx;
                    cntrY = this.innerRadius * my;
                    distance = Math.sqrt(Math.pow((mx - cntrX), 2) + (Math.pow((my - cntrY), 2)));
                    ratio = (distance / 8) / distance;
                    xVal = (ratio * mx + (1 - ratio) * cntrX);
                    yVal = (ratio * my + (1 - ratio) * cntrY);
                    if (clicked == "true")
                        return "translate(" + (xVal) + "," + (yVal) + ")";
                    else
                        return "translate(" + (cntrX) + "," + (cntrY) + ")";
                };
                
				CollabionPie.prototype.elementReposition = function (clickElement) {
                    var startAngle, midAngle, endAngle, mx, my, xVal, yVal, sx, sy, leftSide, rightSide, element, prevElement, nextElement, index, distance, ratio, cntrX, cntrY, parentElement, rootElement, className, pieElement;
                    var slices = this.data.slices;
                    var currentScope = this;
                    var pieSlicedoutIndex = currentScope.data.slicedOutPieIndex;
                    index = parseInt(clickElement.getAttribute("pieIndex"));
                    pieElement = slices[index];
                    parentElement = clickElement.parentNode;
                    rootElement = parentElement.parentNode;
                    className = d3.select(parentElement).attr("class");
                    if (d3.event.defaultPrevented)
                        return;
                    if (this.data.hasHighlights) {
                        currentScope.selectionManager.clear();
                    }
                    else {
                        if (currentScope.selectionManager) {
                            currentScope.selectionManager.select(slices[index].identity);
                        }
						if (slices.length-1 < 1)
							return;
                        else if (pieSlicedoutIndex == index) {
                            currentScope.data.slicedOutPieIndex = -1;
                            slices[index].clicked = "null";
                            slices[index].transform = this.translateTo(pieElement, index, slices[index].clicked);
                            d3.select(this.outer[0][0]).selectAll('g').each(function () {
                                if (d3.select(this).attr('pieIndex') == index) {
                                    d3.select(this).transition().duration(currentScope.durationAnimations).attr("transform", slices[index].transform).attr("clicked", "null");
                                }
                            });
                            d3.select(currentScope.top[0][index]).transition().duration(currentScope.durationAnimations).attr("transform", slices[index].transform);
                            d3.select(currentScope.top[0][index]).attr("clicked", "null");
                        }
                        else {
                            if (pieSlicedoutIndex >= 0) {
                                slices[pieSlicedoutIndex].clicked = "null";
                                slices[pieSlicedoutIndex].transform = this.translateTo(pieElement, pieSlicedoutIndex, slices[pieSlicedoutIndex].clicked);
                                d3.select(this.outer[0][0]).selectAll('g').each(function () {
                                    if (parseInt(d3.select(this).attr('pieIndex')) == pieSlicedoutIndex) {
                                        d3.select(this).transition().duration(currentScope.durationAnimations).attr("transform", slices[pieSlicedoutIndex].transform).attr("clicked", "null");
                                    }
                                });
                                d3.select(currentScope.top[0][pieSlicedoutIndex]).transition().duration(currentScope.durationAnimations).attr("transform", slices[pieSlicedoutIndex].transform);
                                d3.select(currentScope.top[0][pieSlicedoutIndex]).attr("clicked", "null");
                            }
                            currentScope.data.slicedOutPieIndex = index;
                            slices[index].clicked = "true";
                            slices[index].transform = this.translateTo(pieElement, index, slices[index].clicked);
                            d3.select(this.outer[0][0]).selectAll('g').each(function () {
                                if (d3.select(this).attr('pieIndex') == index) {
                                    d3.select(this).transition().duration(currentScope.durationAnimations).attr("transform", slices[index].transform).attr("clicked", "true");
                                }
                            });
                            d3.select(currentScope.top[0][index]).transition().duration(currentScope.durationAnimations).attr("transform", slices[index].transform);
                            d3.select(currentScope.top[0][index]).attr("clicked", "true");
                        }
                    }
                };
                CollabionPie.prototype.rotation = function (currentScope) {
                    var slices, xPosition, yPosition, newXPosition, newYPosition, angle;
                    var changeInYCordinate;
                    var changeInXCordinate;
                    slices = currentScope.data.slices;
					if(slices.length-1==0 || !(this.data.rotationStatus)){
						return;
					}
                    changeInXCordinate = d3.event.dx;
                    changeInYCordinate = d3.event.dy;
                    xPosition = d3.event.x;
                    yPosition = d3.event.y;
                    newXPosition = xPosition + changeInXCordinate;
                    newYPosition = yPosition + changeInYCordinate;
                    angle = (Math.atan2(newYPosition - currentScope.cy, newXPosition - currentScope.cx) - Math.atan2(yPosition - currentScope.cy, xPosition - currentScope.cx));
                    for (var i in slices) {
                        slices[i].startAngle += angle;
                        slices[i].endAngle += angle;
                        if (slices[i].startAngle < 0)
                            slices[i].startAngle += CollabionPie.angle360;
                        else if (slices[i].startAngle > CollabionPie.angle360)
                            slices[i].startAngle %= CollabionPie.angle360;
                        if (slices[i].endAngle > CollabionPie.angle360)
                            slices[i].endAngle %= CollabionPie.angle360;
                        else if (slices[i].endAngle < 0)
                            slices[i].endAngle += CollabionPie.angle360;
                    }
                    currentScope.updatePieLayoutData();
                    if (d3.event != null) {
                        if (currentScope.data.hasHighlights) {
                        
						}
                        else {
							if(this.previousDataLength != this.updatedPieData.length){
								//for (var i = 0; i < this.data.slices.length; i++) {
								//	this.data.slices[i].clicked = "null";
								//}
								//currentScope.updateDonutLayoutData();
								//this.clearDonutPath();
								this.reInitializationOfSvgPaths();
								this.previousDataLength = this.updatedPieData.length;
								this.draw();
								
							}
							else
								currentScope.updateSlicePath();
                        }
                    }
                };
                CollabionPie.prototype.addLabel = function () {
                    var skipElementRight, skipElementLeft, slotStartY, slotEndY, availableSlot, padding, midAngle, slotElement, nonAllocatedItems = [], startOfSecondQuadrant, secondIterator, elementOfFirstQuadrant, totalLeftElement, totalRightElement, skip, skipElementAtRight, skipElementAtLeft, skipElementIndex, side, text, swapElement, swapValue, assignPosition, element, elementOfFourthQuadrant, elementOfSecondThirdQuadrant, slotHeight, midY, minDist;
                    this.textProperties = {
                        text: "HELLO! %#$& Test Chataracter",
                        fontFamily: visuals.dataLabelUtils.StandardFontFamily,
                        fontSize: ((this.data.dataLabelsSettings.fontSize) * (4 / 3)) + "px",
                    };
                    this.textHeight = powerbi.TextMeasurementService.measureSvgTextHeight(this.textProperties);
                    this.avgTextWidth = powerbi.TextMeasurementService.measureSvgTextWidth(this.textProperties) / this.textProperties.text.length;
                    var slices = this.data.slices;
                    this.slotArray = [];
                    var currentScope = this;
                    skipElementRight = [];
                    skipElementLeft = [];
                    element = [];
                    totalRightElement = 0;
                    totalLeftElement = 0;
                    skipElementAtRight = 0;
                    skipElementAtLeft = 0;
                    padding = 4;
                    slotStartY = this.textRy * Math.sin(CollabionPie.angle270);
                    slotEndY = this.textRy * Math.sin(CollabionPie.angle90);
                    //calculate textHeight
                    this.data.slotHeight = this.textHeight + padding;
                    slotHeight = this.data.slotHeight;
                    _.each(slices, function (d, i) {
                        if (d.midAngle > CollabionPie.angle90 && d.midAngle <= CollabionPie.angle270) {
                            skipElementLeft.push({
                                'dataIndex': i,
                                'dataValue': d.value
                            });
                            totalLeftElement++;
                        }
                        else {
                            skipElementRight.push({
                                'dataIndex': i,
                                'dataValue': d.value
                            });
                            totalRightElement++;
                        }
                        d.dataLabelStatus = 'off';
                        d.labelSlotIndex = -1;
                    });
                    availableSlot = Math.round(2 * ((slotEndY - slotStartY) / this.data.slotHeight));
                    if (Math.round(availableSlot / 2) < totalRightElement || Math.round(availableSlot / 2) < totalLeftElement) {
                        skipElementLeft.sort(function (a, b) {
                            if (a.dataValue > b.dataValue) {
                                return 1;
                            }
                            if (a.dataValue < b.dataValue) {
                                return -1;
                            }
                            return 0;
                        });
                        skipElementRight.sort(function (a, b) {
                            if (a.dataValue > b.dataValue) {
                                return 1;
                            }
                            if (a.dataValue < b.dataValue) {
                                return -1;
                            }
                            return 0;
                        });
                        if (Math.round(availableSlot / 2) < totalRightElement) {
                            skipElementAtRight = totalRightElement - Math.round(availableSlot / 2);
                        }
                        if (Math.round(availableSlot / 2) < totalLeftElement) {
                            skipElementAtLeft = totalLeftElement - Math.round(availableSlot / 2);
                        }
                        for (var iterator = 0; iterator <= skipElementAtLeft; iterator++) {
                            skipElementLeft[iterator].dataIndex = -1;
                        }
                        skipElementLeft = skipElementLeft.filter(function (val) {
                            return val.dataIndex > -1;
                        });
                        for (iterator = 0; iterator <= skipElementAtRight; iterator++) {
                            skipElementRight[iterator].dataIndex = -1;
                        }
                        skipElementRight = skipElementRight.filter(function (val) {
                            return val.dataIndex > -1;
                        });
                    }
                    for (iterator = 0; iterator < Math.round(availableSlot / 2); iterator++) {
                        this.slotArray.push({
                            index: iterator,
                            startY: slotStartY + (iterator * slotHeight),
                            endY: (slotStartY + (iterator * slotHeight)) + slotHeight,
                            startX: Math.sqrt((Math.pow(this.textRx, 2) * (Math.pow(this.textRy, 2) - Math.pow((slotStartY + (iterator * slotHeight)), 2))) / Math.pow(this.textRy, 2)),
                            dataIndex: -1
                        });
                        this.slotArray.push({
                            index: iterator + Math.round(availableSlot / 2),
                            startY: slotStartY + (iterator * slotHeight),
                            endY: (slotStartY + (iterator * slotHeight)) + slotHeight,
                            startX: Math.sqrt((Math.pow(this.textRx, 2) * (Math.pow(this.textRy, 2) - Math.pow((slotStartY + (iterator * slotHeight)), 2))) / Math.pow(this.textRy, 2)) * -1,
                            dataIndex: -1
                        });
                    }
                    this.slotArray.sort(function (a, b) {
                        if (a.index > b.index) {
                            return 1;
                        }
                        if (a.index < b.index) {
                            return -1;
                        }
                        return 0;
                    });
                    slices.forEach(function (d, i) {
                        var labelSide;
                        midAngle = d.midAngle;
                        skip = true;
                        if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270) {
                            labelSide = 'left';
                            skipElementLeft.forEach(function (item, j) {
                                if (i === item.dataIndex)
                                    skip = false;
                            });
                        }
                        else {
                            labelSide = 'right';
                            skipElementRight.forEach(function (item, j) {
                                if (i === item.dataIndex)
                                    skip = false;
                            });
                        }
                        if (skip === false) {
                            midY = currentScope.textRy * Math.sin(midAngle);
                            for (iterator = 0; iterator < Math.round(availableSlot / 2); iterator++) {
                                if (labelSide === 'left') {
                                    slotElement = iterator + Math.round(availableSlot / 2);
                                }
                                else {
                                    slotElement = iterator;
                                }
                                if (midY >= currentScope.slotArray[slotElement].startY && midY <= currentScope.slotArray[slotElement].endY) {
                                    if (currentScope.slotArray[slotElement].dataIndex === -1) {
                                        currentScope.slotArray[slotElement].dataIndex = i;
                                        currentScope.slotArray[slotElement].labelValue = CollabionPie.labels[i];
                                    }
                                    else {
                                        nonAllocatedItems.push({
                                            dataIndex: i,
                                            side: labelSide,
                                            labelValue: CollabionPie.labels[i],
                                            actualSlot: slotElement
                                        });
                                    }
                                }
                            }
                        }
                    });
                    if (nonAllocatedItems.length > 0) {
                        nonAllocatedItems.forEach(function (d, i) {
                            minDist = currentScope.slotArray.length;
                            for (iterator = 0; iterator < Math.round(availableSlot / 2); iterator++) {
                                if (d.side === 'left') {
                                    slotElement = iterator + Math.round(availableSlot / 2);
                                }
                                else {
                                    slotElement = iterator;
                                }
                                if (currentScope.slotArray[slotElement].dataIndex === -1) {
                                    if (minDist > Math.abs(d.actualSlot - slotElement)) {
                                        minDist = Math.abs(d.actualSlot - slotElement);
                                        assignPosition = slotElement;
                                    }
                                }
                            }
                            currentScope.slotArray[assignPosition].dataIndex = d.dataIndex;
                            currentScope.slotArray[assignPosition].labelValue = d.labelValue;
                        });
                    }
                    this.slotArray = this.slotArray.filter(function (val) {
                        return val.dataIndex > -1;
                    });
                    startOfSecondQuadrant = availableSlot;
                    elementOfFirstQuadrant = 0;
                    elementOfSecondThirdQuadrant = 0;
                    elementOfFourthQuadrant = 0;
                    this.slotArray.forEach(function (d, i) {
                        var midAngle;
                        d.index = i;
                        midAngle = slices[d.dataIndex].midAngle;
                        if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270) {
                            elementOfSecondThirdQuadrant++;
                            startOfSecondQuadrant = Math.min(startOfSecondQuadrant, d.index);
                        }
                        if (midAngle >= 0 && midAngle <= CollabionPie.angle90) {
                            elementOfFirstQuadrant++;
                        }
                        if (midAngle > CollabionPie.angle270 && midAngle <= CollabionPie.angle360) {
                            elementOfFourthQuadrant++;
                        }
                    });
					if (elementOfSecondThirdQuadrant > 0) {
                        for (iterator = startOfSecondQuadrant; iterator < this.slotArray.length; iterator++) {
                            for (secondIterator = startOfSecondQuadrant; secondIterator <= iterator; secondIterator++) {
                                if (slices[(this.slotArray[iterator].dataIndex)].midAngle > slices[(this.slotArray[secondIterator].dataIndex)].midAngle) {
                                    swapElement = this.slotArray[iterator].dataIndex;
                                    this.slotArray[iterator].dataIndex = this.slotArray[secondIterator].dataIndex;
                                    this.slotArray[secondIterator].dataIndex = swapElement;
                                    swapValue = this.slotArray[iterator].labelValue;
                                    this.slotArray[iterator].labelValue = this.slotArray[secondIterator].labelValue;
                                    this.slotArray[secondIterator].labelValue = swapValue;
                                }
                            }
                        }
                        for (iterator = 0; iterator < startOfSecondQuadrant; iterator++) {
                            for (secondIterator = 0; secondIterator <= iterator; secondIterator++) {
                                if (slices[(this.slotArray[iterator].dataIndex)].midAngle < slices[(this.slotArray[secondIterator].dataIndex)].midAngle) {
                                    swapElement = this.slotArray[iterator].dataIndex;
                                    this.slotArray[iterator].dataIndex = this.slotArray[secondIterator].dataIndex;
                                    this.slotArray[secondIterator].dataIndex = swapElement;
                                    swapValue = this.slotArray[iterator].labelValue;
                                    this.slotArray[iterator].labelValue = this.slotArray[secondIterator].labelValue;
                                    this.slotArray[secondIterator].labelValue = swapValue;
                                }
                            }
                        }
                        for (iterator = 0; iterator < elementOfFirstQuadrant; iterator++) {
                            element.push({
                                'dataIndex': this.slotArray[iterator].dataIndex,
                                'labelValue': this.slotArray[iterator].labelValue
                            });
                        }
                        element.reverse();
                        for (iterator = elementOfFirstQuadrant; iterator < startOfSecondQuadrant; iterator++) {
                            this.slotArray[iterator - elementOfFirstQuadrant].dataIndex = this.slotArray[iterator].dataIndex;
                            this.slotArray[iterator - elementOfFirstQuadrant].labelValue = this.slotArray[iterator].labelValue;
                        }
                        iterator = startOfSecondQuadrant - 1;
                        element.forEach(function (d, i) {
                            currentScope.slotArray[iterator].dataIndex = d.dataIndex;
                            currentScope.slotArray[iterator].labelValue = d.labelValue;
                            iterator--;
                        });
                    }
                    this.slotArray.forEach(function (d, i) {
                        if (slices[d.dataIndex].midAngle > CollabionPie.angle90 && slices[d.dataIndex].midAngle <= CollabionPie.angle270) {
                            d.startX = Math.min(d.startX, currentScope.textRx * Math.cos(slices[d.dataIndex].midAngle));
                        }
                        else {
                            d.startX = Math.max(d.startX, currentScope.textRx * Math.cos(slices[d.dataIndex].midAngle));
                        }
                    });
                };
                CollabionPie.prototype.labelText = function (d) {
					var slices = this.data.slices;
                    var textWidth, midAngle, excessChar, labelValue, slotElement,midY;
                    if (d.labelSlotIndex != undefined && d.labelSlotIndex != null) {
                        if (d.labelSlotIndex > -1) {
                            slotElement = this.slotArray[(d.labelSlotIndex)];
                            labelValue = d.labeltext; 
                            midAngle = slices[parseInt(slotElement.dataIndex)].midAngle;
                            if (labelValue != undefined) {
                                textWidth = this.avgTextWidth * (labelValue).length;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270) {
                                    if (slotElement.startX - textWidth < -(this.cx)) {
                                        excessChar = Math.round((-(this.cx) - (slotElement.startX - textWidth)) / this.avgTextWidth);
                                        labelValue = labelValue.substring(0, labelValue.length - Math.abs(excessChar + 4));
                                        labelValue += "...";
                                    }
								}
                                else {
                                    if (slotElement.startX + textWidth > this.cx) {
                                        excessChar = Math.round((slotElement.startX + textWidth - (this.cx)) / this.avgTextWidth);
                                        labelValue = labelValue.substring(0, labelValue.length - Math.abs(excessChar + 4));
                                        labelValue += "...";
                                    }
                                }
								midY = this.textRy * Math.sin(CollabionPie.angle180);
								if(midAngle >= 0  && midAngle <= CollabionPie.angle180){
									if(slotElement.startY < midY)
									labelValue = "...";
								}
								else{
									if(slotElement.startY > midY)
										labelValue = "...";
								}
                                if ((slotElement.startY + this.data.pieThickness / 2) < -this.cy + this.data.pieThickness) {
                                    labelValue = "...";
                                }
                                if (labelValue === "...") {
                                    labelValue = "";
                                    slotElement.labelExist = 'no';
                                }
                                else {
                                    slotElement.labelExist = 'yes';
                                }
                                return labelValue;
                            }
                        }
                        else {
                            return null;
                        }
                    }
                    else
                        return null;
                };
				
                CollabionPie.prototype.updatePieLayoutData = function () {
                    var slices = this.data.slices;
                    var noOfSlices = slices.length - 1;
                    var diff, partitionedSlice;
                    this.updatedPieData = [];
                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = -1;
                    CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy270 = 0;
                    CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy90 = 0;
                    var currentScope = this;
                    _.each(slices, function (d, i) {
                        var partitionedSlice;
                        partitionedSlice = {};
                        d.midAngle = d.startAngle > d.endAngle ? (d.startAngle + (CollabionPie.angle360 - d.startAngle + d.endAngle) / 2) % CollabionPie.angle360 : ((d.endAngle - d.startAngle) / 2) + d.startAngle;
                        d.labelSlotIndex = -1;
                        d.dataLabelStatus = "off";
                        if (typeof d === 'object') {
                            for (var dataObject in d) {
                                partitionedSlice[dataObject] = d[dataObject];
                            }
                            this.updatedPieData[i] = partitionedSlice;
                        }
                        this.updatedPieData[i].index = i;
                        diff = d.endAngle < d.startAngle ? CollabionPie.angle360 + d.endAngle - d.startAngle : d.endAngle - d.startAngle;
                        if (d.startAngle <= CollabionPie.angle270 && d.endAngle > CollabionPie.angle270 || d.startAngle <= CollabionPie.angle270 && d.endAngle < d.startAngle || d.startAngle > CollabionPie.angle270 && d.endAngle > CollabionPie.angle270 && diff >= CollabionPie.angle270) {
                            CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = i;
                        }
                        else if (d.startAngle <= CollabionPie.angle90 && d.endAngle >= CollabionPie.angle90 || d.endAngle >= CollabionPie.angle90 && (d.endAngle - diff) <= CollabionPie.angle90) {
                            CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = i;
                        }
                    }, this);
                    if (this.data.dataLabelsSettings.show === true && typeof this.data.showDataLabels !== "undefined" && slices.length > 0) {
                        this.addLabel();
                        _.each(this.slotArray, function (d, i) {
                            if (d.labelValue === "") {
                                slices[(d.dataIndex)].dataLabelStatus = 'off';
                                slices[(d.dataIndex)].labelSlotIndex = -1;
                                currentScope.updatedPieData[(d.dataIndex)].dataLabelStatus = 'off';
                                currentScope.updatedPieData[(d.dataIndex)].labelSlotIndex = -1;
                            }
                            else {
                                slices[(d.dataIndex)].dataLabelStatus = 'on';
                                slices[(d.dataIndex)].labelSlotIndex = d.index;
                                currentScope.updatedPieData[(d.dataIndex)].dataLabelStatus = 'on';
                                currentScope.updatedPieData[(d.dataIndex)].labelSlotIndex = d.index;
                            }
                        });
                    }
                    if (noOfSlices > 0) {
                        if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 === -1) {
                            CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 <= noOfSlices ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 : 0;
                            if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle > CollabionPie.angle270 || slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle < CollabionPie.angle90) {
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) > noOfSlices ? 0 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1;
                            }
                            else {
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = -1;
                            }
                        }
                        else {
                            // as the element does not cover 270 degree 
                            CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != noOfSlices && (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1) != CollabionPie1482191307239.indexMappingSlicePosition.elementAt270) ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1 : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 == noOfSlices && CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != 0 ? 0 : -1);
                            CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) <= noOfSlices ? ((CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) != CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 : -1) : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != 0 ? 0 : -1);
                            CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1) < 0 ? (noOfSlices != CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? noOfSlices : -1) : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1) ? -1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1);
                        }
                        if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != -1) {
                            CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy270 = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle < slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle ? slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle : slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle + CollabionPie.angle360 - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle;
                        }
                        if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != -1) {
                            CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy90 = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle < slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle ? slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle : slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle + CollabionPie.angle360 - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle;
                        }
                        if (CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy270 >= CollabionPie.angle180) {
                            if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle < CollabionPie.angle270 && slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle >= CollabionPie.angle90) {
                                //treat as bottom left element                             
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle = CollabionPie.angle270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) : (CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex - 1) < 0 ? slices.length  : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex - 1 < 0 ? slices.length  : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex - 1;
                                //treat as top left element
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt270,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle,
                                    endAngle: CollabionPie.angle270,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex,
                                };
                                this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270, 0, partitionedSlice);
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = -1;
                            }
                            else if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle > CollabionPie.angle270 || (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle > 0 && slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle < CollabionPie.angle90)) {
                                //treat as top right element                             
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle = CollabionPie.angle270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex < CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex : CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1;
                                CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1 < 0 ? this.updatedPieData.length : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1) : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1 < 0 ? this.updatedPieData.length : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1)) : (CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 < CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1;
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt270,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle,
                                    endAngle: CollabionPie.angle270,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex,
                                };
                                if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle < CollabionPie.angle90 || slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle > CollabionPie.angle270) {
                                    //treat as bottom right element
                                    this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270, 0, partitionedSlice);
                                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 += 1;
                                }
                                else {
                                    // treat as top left
                                    this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270, 0, partitionedSlice);
                                    CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 : CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + 1;
                                    CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex : (CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex);
                                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 += 1;
                                }
                            }
                        }
                        else if (CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy90 >= CollabionPie.angle180) {
                            //bottom right
                            if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle > CollabionPie.angle270) {
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt90,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle,
                                    endAngle: CollabionPie.angle360,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex,
                                };
                                this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt90, 0, partitionedSlice);
                                CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 : CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex + 1;
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                //90 degree element
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt90;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].startAngle = 0;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == 0 ? this.updatedPieData.length - 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1)) : (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + 1);
                                //leftEndIndex
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 += 1;
                            }
                            else {
                                //90 degree element
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt90,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle,
                                    endAngle: CollabionPie.angle180,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex,
                                };
                                this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt90, 0, partitionedSlice);
                                CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1 < 0 ? this.updatedPieData.length - 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1) : (CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90) ? CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex;
                                //bottom left element
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt90;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].startAngle = CollabionPie.angle180;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 < CollabionPie1482191307239.indexMappingSlicePosition.elementAt90) ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1 > this.updatedPieData.length - 1 ? 0 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1) : (CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1 : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1 < 0 ? this.updatedPieData.length - 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1) : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex) : CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + 1;
                            }
                        }
                        else {
                            CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == 0) ? (this.updatedPieData.length - 1 == CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? -1 : this.updatedPieData.length - 1) : ((CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1) == CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? -1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1);
                        }
                    }
                    else {
                        CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = -1;
                        CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = 0;
						this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle=CollabionPie.angle360;
						slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle=CollabionPie.angle360;
                    }
                };
                CollabionPie.prototype.updateHighlightedSliceObject = function () {
                    var slices = this.updatedPieData;
                    var highlightedSlice = this.data.highlightedSlice;
                    var index = 0;
                    var partitionedSlice;
                    if (slices.length > this.data.highlightedSlice.length) {
                        while (index <= slices.length - 2) {
                            if (slices[index].index == slices[index + 1].index) {
                                partitionedSlice = {
                                    index: index,
                                    startAngle: slices[index + 1].startAngle,
                                    endAngle: highlightedSlice[index].endAngle > slices[index].endAngle ? highlightedSlice[index].endAngle : null,
                                    midAngle: slices[index + 1].midAngle,
                                    transform: slices[index + 1].transform,
                                    color: slices[index + 1].color,
                                    categoryOrMeasureIndex: slices[index + 1].categoryOrMeasureIndex,
                                    highlightValue: highlightedSlice[index].highlightValue
                                };
                                this.data.highlightedSlice[index].startAngle = slices[index].startAngle;
                                this.data.highlightedSlice[index].endAngle = slices[index].endAngle > this.data.highlightedSlice[index].endAngle ? this.data.highlightedSlice[index].endAngle : slices[index].endAngle;
                                this.data.highlightedSlice[index].midAngle = slices[index].midAngle;
                                this.data.highlightedSlice.splice(index + 1, 0, partitionedSlice);
                            }
                            index++;
                        }
                    }
                };
                CollabionPie.prototype.updateFilteredPieLayoutData = function () {
                    var slices = this.data.highlightedSlice;
                    var noOfSlices = slices.length - 1;
                    var diff, partitionedSlice;
                    this.updatedPieData = [];
                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = -1;
                    CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy270 = 0;
                    CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy90 = 0;
                    var currentScope = this;
                    _.each(slices, function (d, i) {
                        var partitionedSlice;
                        partitionedSlice = {};
                        d.midAngle = d.startAngle > d.endAngle ? (d.startAngle + (CollabionPie.angle360 - d.startAngle + d.endAngle) / 2) % CollabionPie.angle360 : ((d.endAngle - d.startAngle) / 2) + d.startAngle;
                        d.labelSlotIndex = -1;
                        d.dataLabelStatus = "off";
                        if (typeof d === 'object') {
                            for (var dataObject in d) {
                                partitionedSlice[dataObject] = d[dataObject];
                            }
                            this.updatedPieData[i] = partitionedSlice;
                        }
                        this.updatedPieData[i].index = i;
                        if (d.highlightValue != null) {
                            diff = d.endAngle < d.startAngle ? CollabionPie.angle360 + d.endAngle - d.startAngle : d.endAngle - d.startAngle;
                            if (d.startAngle <= CollabionPie.angle270 && d.endAngle > CollabionPie.angle270 || d.startAngle <= CollabionPie.angle270 && d.endAngle < d.startAngle || d.startAngle > CollabionPie.angle270 && d.endAngle > CollabionPie.angle270 && diff >= CollabionPie.angle270) {
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = i;
                            }
                            else if (d.startAngle <= CollabionPie.angle90 && d.endAngle >= CollabionPie.angle90 || d.endAngle >= CollabionPie.angle90 && (d.endAngle - diff) <= CollabionPie.angle90) {
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = i;
                            }
                        }
                    }, this);
                    if (this.data.dataLabelsSettings.show === true && typeof this.data.showDataLabels !== "undefined" && slices.length > 0) {
                        this.addLabel();
                        _.each(this.slotArray, function (d, i) {
                            if (d.labelValue === "") {
                                slices[(d.dataIndex)].dataLabelStatus = 'off';
                                slices[(d.dataIndex)].labelSlotIndex = -1;
                                currentScope.updatedPieData[(d.dataIndex)].dataLabelStatus = 'off';
                                currentScope.updatedPieData[(d.dataIndex)].labelSlotIndex = -1;
                            }
                            else {
                                slices[(d.dataIndex)].dataLabelStatus = 'on';
                                slices[(d.dataIndex)].labelSlotIndex = d.index;
                                currentScope.updatedPieData[(d.dataIndex)].dataLabelStatus = 'on';
                                currentScope.updatedPieData[(d.dataIndex)].labelSlotIndex = d.index;
                            }
                        });
                    }
                    if (noOfSlices > 0) {
                        if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 === -1) {
                            CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 <= noOfSlices ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 : 0;
                            if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle > CollabionPie.angle270 || slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle < CollabionPie.angle90) {
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) > noOfSlices ? 0 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1;
                            }
                            else {
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = -1;
                            }
                        }
                        else {
                            // as the element does not cover 270 degree 
                            CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != noOfSlices && (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1) != CollabionPie1482191307239.indexMappingSlicePosition.elementAt270) ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1 : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 == noOfSlices && CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != 0 ? 0 : -1);
                            CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) <= noOfSlices ? ((CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) != CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 : -1) : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != 0 ? 0 : -1);
                            CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1) < 0 ? (noOfSlices != CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? noOfSlices : -1) : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1) ? -1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1);
                        }
                        if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != -1) {
                            CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy270 = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle < slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle ? slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle : slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle + CollabionPie.angle360 - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle;
                        }
                        if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != -1) {
                            CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy90 = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle < slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle ? slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle : slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle + CollabionPie.angle360 - slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle;
                        }
                        if (CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy270 >= CollabionPie.angle180) {
                            if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle < CollabionPie.angle270 && slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle >= CollabionPie.angle90) {
                                //treat as bottom left element                             
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle = CollabionPie.angle270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1) : (CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex - 1) < 0 ? slices.length  : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex - 1 < 0 ? slices.length  : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex - 1;
                                //treat as top left element
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt270,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle,
                                    endAngle: CollabionPie.angle270,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex,
                                };
                                this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270, 0, partitionedSlice);
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = -1;
                            }
                            else if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle > CollabionPie.angle270 || (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle > 0 && slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle < CollabionPie.angle90)) {
                                //treat as top right element                             
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle = CollabionPie.angle270;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex < CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex : CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1;
                                CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1 < 0 ? this.updatedPieData.length : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1) : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1 < 0 ? this.updatedPieData.length : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1)) : (CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 < CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1;
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt270,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle,
                                    endAngle: CollabionPie.angle270,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].categoryOrMeasureIndex,
                                };
                                if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle < CollabionPie.angle90 || slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle > CollabionPie.angle270) {
                                    //treat as bottom right element
                                    this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270, 0, partitionedSlice);
                                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 += 1;
                                }
                                else {
                                    // treat as top left
                                    this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270, 0, partitionedSlice);
                                    CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 : CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + 1;
                                    CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex : (CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 ? CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex);
                                    CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 += 1;
                                }
                            }
                        }
                        else if (CollabionPie1482191307239.angleCoveredBySlice.angleCoveredBy90 >= CollabionPie.angle180) {
                            //bottom right
                            if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle > CollabionPie.angle270) {
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt90,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle,
                                    endAngle: CollabionPie.angle360,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex,
                                };
                                this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt90, 0, partitionedSlice);
                                CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 : CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex + 1;
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                                //90 degree element
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt90;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].startAngle = 0;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == 0 ? this.updatedPieData.length - 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1)) : (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + 1);
                                //leftEndIndex
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 += 1;
                            }
                            else {
                                //90 degree element
                                partitionedSlice = {
                                    index: CollabionPie1482191307239.indexMappingSlicePosition.elementAt90,
                                    startAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].startAngle,
                                    endAngle: CollabionPie.angle180,
                                    midAngle: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle,
                                    transform: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform,
                                    color: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color,
                                    categoryOrMeasureIndex: slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex,
                                };
                                this.updatedPieData.splice(CollabionPie1482191307239.indexMappingSlicePosition.elementAt90, 0, partitionedSlice);
                                CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1 < 0 ? this.updatedPieData.length - 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 - 1) : (CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex == -1 ? CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90) ? CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1 : CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex;
                                //bottom left element
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].index = CollabionPie1482191307239.indexMappingSlicePosition.elementAt90;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].startAngle = CollabionPie.angle180;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].endAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].endAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].midAngle = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].transform = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].color = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color;
                                this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1].categoryOrMeasureIndex = slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex;
                                CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 < CollabionPie1482191307239.indexMappingSlicePosition.elementAt90) ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 + 1;
                                CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1 > this.updatedPieData.length - 1 ? 0 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1) : (CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex > CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 + 1 : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex);
                                CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex == -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != -1 ? (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1 < 0 ? this.updatedPieData.length - 1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1) : CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex) : CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + 1;
                            }
                        }
                        else {
                            CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex = (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 == 0) ? (this.updatedPieData.length - 1 == CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? -1 : this.updatedPieData.length - 1) : ((CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1) == CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 ? -1 : CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 - 1);
                        }
                    }
                    else {
                        CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 = -1;
                        CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 = 0;
                    }
                };
                CollabionPie.prototype.updateSlicePath = function () {
                    var slicesLeftOnPieRightSide, index, pathIndex, elementsBetween90and270;
                    slicesLeftOnPieRightSide = index = 0;
                    var slices = this.data.slices, currentScope;
                    var noOFSlices = slices.length - 1;
                    var outerSurface;
                    currentScope = this;
                    var dataIndex;
                    if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != -1) {
                        d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index).attr("transform", function () {
                            dataIndex = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index;
                            if (slices[dataIndex].clicked == "true") {
                                return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                            }
                            else
                                return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform;
                        });
                        //Outer & Side Elements
                        if (this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex > -1) {
                            d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].dataIndex).attr("x", function () {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex)].startX;
                            }).attr("y", function (d, i) {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                            }).text(currentScope.labelText(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                var midAngle;
                                midAngle = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                    return 'end';
                                else
                                    return 'start';
                            });
                        }
                        else {
                            d3.select(this.outerSurface[0][index]).select("text").text(null);
                        }
                        d3.select(currentScope.outerSurface[0][index]).selectAll("path").each(function () {
                            outerSurface = currentScope.pieOuter(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270]);
                            if (d3.select(this).attr("pos") === "first") {
                                d3.select(this).attr("d", function () {
                                    return outerSurface.pieOuter;
                                }).style("fill", function () {
                                    return currentScope.outerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.outerSurfaceColor, currentScope);
                                }).style("fill-opacity", "1").style("stroke", d3.rgb(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color).toString()).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            }
                            else if (d3.select(this).attr("pos") === "second") {
                                d3.select(this).attr("d", function () {
                                    return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270], "left");
                                }).style("fill", function () {
                                    return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.leftSurfaceColor, currentScope);
                                }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            }
                            else if (d3.select(this).attr("pos") === "third") {
                                d3.select(this).attr("d", function () {
                                    return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270], "right");
                                }).style("fill", function () {
                                    return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.rightSurfaceColor, currentScope);
                                }).style("fill-opacity", "1").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            }
                            else if (d3.select(this).attr("class") === "outerEdgeGradientPath") {
                                d3.select(this).attr("d", function () {
                                    return outerSurface.pieOuterEdgeLight;
                                }).style("fill", function () {
                                    return currentScope.edgeGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.outerSurfaceColor, currentScope);
                                }).style("stroke", currentScope.edgeGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.outerSurfaceColor, currentScope)).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            }
                            else if (d3.select(this).attr("class") == "pointingLine") {
                                if (currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].dataLabelStatus == "on") {
                                    d3.select(this).attr("index", function (d, i) {
                                        return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index;
                                    }).attr("d", currentScope.LabelLine(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270));
                                }
                                else {
                                    d3.select(this).attr("d", null);
                                }
                            }
                        });
                        index++;
                    }
                    pathIndex = 0;
                    /*LEFT SIDE ELEMENT */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex != -1 && CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex != -1) {
                        elementsBetween90and270 = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex < CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex ? CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + this.updatedPieData.length - CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex - CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex);
                        pathIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex;
                        while (elementsBetween90and270 >= 0) {
                            //Outer & Side Elements
                            d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[pathIndex].index).attr("transform", function () {
                                dataIndex = currentScope.updatedPieData[pathIndex].index;
                                if (slices[dataIndex].clicked == "true") {
                                    return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                                }
                                else
                                    return currentScope.updatedPieData[pathIndex].transform;
                            });
                            if (this.updatedPieData[pathIndex].labelSlotIndex > -1) {
                                d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[pathIndex].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[pathIndex].labelSlotIndex)].startX).attr("y", function (d, i) {
                                    return currentScope.slotArray[parseInt(currentScope.updatedPieData[pathIndex].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                                }).text(currentScope.labelText(currentScope.updatedPieData[pathIndex])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                    var midAngle;
                                    midAngle = currentScope.updatedPieData[pathIndex].midAngle;
                                    if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                        return 'end';
                                    else
                                        return 'start';
                                });
                            }
                            else {
                                d3.select(this.outerSurface[0][index]).select("text").text(null);
                            }
                            d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                                outerSurface = currentScope.pieOuter(currentScope.updatedPieData[pathIndex]);
                                if (d3.select(this).attr("pos") == "first") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(currentScope.updatedPieData[pathIndex], "left");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[pathIndex].color.leftSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                }
                                else if (d3.select(this).attr("pos") == "second") {
                                    var color = currentScope.outerSurfaceGradient(currentScope.updatedPieData[pathIndex].color.outerSurfaceColor, currentScope);
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuter;
                                    }).style("fill", function () {
                                        return color;
                                    }).style("fill-opacity", "1").style("stroke", color).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                }
                                else if (d3.select(this).attr("pos") == "third") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(currentScope.updatedPieData[pathIndex], "right");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[pathIndex].color.rightSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                }
                                else if (d3.select(this).attr("class") == "outerEdgeGradientPath") {
                                    var color = currentScope.edgeGradient(currentScope.updatedPieData[pathIndex].color.outerSurfaceColor, currentScope);
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuterEdgeLight;
                                    }).style("fill", function () {
                                        return color;
                                    }).style("stroke", color).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                }
                                else {
                                    if (d3.select(this).attr("class") == "pointingLine")
                                        if (currentScope.updatedPieData[pathIndex].dataLabelStatus == "on") {
                                            d3.select(this).attr("index", function (d, i) {
                                                return currentScope.updatedPieData[pathIndex].index;
                                            }).attr("d", currentScope.LabelLine(pathIndex));
                                        }
                                        else {
                                            d3.select(this).attr("d", null);
                                        }
                                }
                            });
                            index++;
                            elementsBetween90and270--;
                            pathIndex = (pathIndex - 1) < 0 ? this.updatedPieData.length - 1 : pathIndex - 1;
                        }
                    }
                    pathIndex = 0;
                    slicesLeftOnPieRightSide = (this.updatedPieData.length) - index - (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 == -1 ? 0 : 1);
                    /*ELEMENT AT RIGHT SIDE */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex != -1 && CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex != -1) {
                        while (pathIndex < slicesLeftOnPieRightSide) {
                            //Outer & Side Elements 
                            d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index).attr("transform", function () {
                                dataIndex = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index;
                                if (slices[dataIndex].clicked == "true") {
                                    return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                                }
                                else
                                    return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].transform;
                            });
                            if (this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].labelSlotIndex > -1) {
                                d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].labelSlotIndex)].startX).attr("y", function (d, i) {
                                    return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                                }).text(currentScope.labelText(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                    var midAngle;
                                    midAngle = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].midAngle;
                                    if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                        return 'end';
                                    else
                                        return 'start';
                                });
                            }
                            else {
                                d3.select(this.outerSurface[0][index]).select("text").text(null);
                            }
                            d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                                outerSurface = currentScope.pieOuter(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex]);
                                if (d3.select(this).attr("pos") === "first") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex], "right");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].color.rightSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index).attr("class", "right");
                                }
                                else if (d3.select(this).attr("pos") === "second") {
                                    var color = currentScope.outerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].color.outerSurfaceColor, currentScope);
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuter;
                                    }).style("fill", function () {
                                        return color;
                                    }).style("fill-opacity", "1").style("stroke", color).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index);
                                }
                                else if (d3.select(this).attr("pos") === "third") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex], "left");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].color.leftSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index);
                                }
                                else if (d3.select(this).attr("class") === "outerEdgeGradientPath") {
                                    var color = currentScope.edgeGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].color.outerSurfaceColor, currentScope);
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuterEdgeLight;
                                    }).style("fill", function () {
                                        return color;
                                    }).style("stroke", color).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index);
                                }
                                else {
                                    if (d3.select(this).attr("class") == "pointingLine")
                                        if (currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].dataLabelStatus == "on") {
                                            d3.select(this).attr("index", function (d, i) {
                                                return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index;
                                            }).attr("d", currentScope.LabelLine(CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex));
                                        }
                                        else {
                                            d3.select(this).attr("d", null);
                                        }
                                }
                            });
                            index++;
                            pathIndex++;
                            CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1 > this.updatedPieData.length - 1 ? 0 : CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex + 1;
                        }
                    }
                    /*ELEMENT AT 90 */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != -1) {
                        //Outer & Side Elements
                        d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index).attr("transform", function () {
                            dataIndex = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index;
                            if (slices[dataIndex].clicked == "true") {
                                return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                            }
                            else
                                return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform;
                        });
                        if (this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex > -1) {
                            d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex)].startX).attr("y", function (d, i) {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                            }).text(currentScope.labelText(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                var midAngle;
                                midAngle = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                    return 'end';
                                else
                                    return 'start';
                            });
                        }
                        else {
                            d3.select(this.outerSurface[0][index]).select("text").text(null);
                        }
                        d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                            outerSurface = currentScope.pieOuter(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90]);
                            if (d3.select(this).attr("pos") === "first") {
                                d3.select(this).attr("d", function () {
                                    return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90], "left");
                                }).style("fill", function () {
                                    return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.leftSurfaceColor, currentScope);
                                }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            }
                            else if (d3.select(this).attr("pos") === "second") {
                                d3.select(this).attr("d", function () {
                                    return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90], "right");
                                }).style("fill", function () {
                                    return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.rightSurfaceColor, currentScope);
                                }).style("fill-opacity", "1").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            }
                            else if (d3.select(this).attr("pos") === "third") {
                                var color = currentScope.outerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.outerSurfaceColor, currentScope);
                                d3.select(this).attr("d", function () {
                                    return outerSurface.pieOuter;
                                }).style("fill", function () {
                                    return color;
                                }).style("fill-opacity", "1").style("stroke", color).style("stroke-width", "0.1").attr("class", "outer").attr('categoryOrMeasureIndex', currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex).attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            }
                            else if (d3.select(this).attr("class") === "outerEdgeGradientPath") {
                                var color = currentScope.edgeGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.outerSurfaceColor, currentScope);
                                d3.select(this).attr("d", function () {
                                    return outerSurface.pieOuterEdgeLight;
                                }).style("fill", function () {
                                    return color;
                                }).style("stroke", color).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            }
                            else {
                                if (d3.select(this).attr("class") == "pointingLine")
                                    if (currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].dataLabelStatus == "on") {
                                        d3.select(this).attr("index", function (d, i) {
                                            return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index;
                                        }).attr("d", currentScope.LabelLine(CollabionPie1482191307239.indexMappingSlicePosition.elementAt90));
                                    }
                                    else {
                                        d3.select(this).attr("d", null);
                                    }
                            }
                        });
                    }
                    for (index = 0; index <= noOFSlices; index++) {
                        //Top Element
                        var color, edgeColor;
                        var topElement;
                        topElement = currentScope.pieTop(slices[index]);
                        color = currentScope.topSurfaceGradient(slices[index].color.topSurfaceColor, currentScope);
                        edgeColor = currentScope.edgeGradient(slices[index].color.topSurfaceColor, currentScope);
                        d3.select(this.top[0][index]).attr("transform", function () {
                            if (slices[index].clicked == "true") {
                                return currentScope.translateTo(slices[index], index, slices[index].clicked);
                            }
                            else
                                return slices[index].transform;
                        });
                        d3.select(this.top[0][index]).selectAll("path").each(function () {
                            if (d3.select(this).attr("class") === "topSurface") {
                                d3.select(this).attr("d", function () {
                                    return topElement.pieTop;
                                }).style("fill", color).style("stroke", color).style("fill-opacity", "1").style("stroke-width", "0.1").attr("pieIndex", index);
                            }
                            else {
                                d3.select(this).attr("d", function () {
                                    return topElement.pieTopEdgeLight;
                                }).style("fill", edgeColor).style("stroke", edgeColor).style("stroke-width", "0.1").attr("pieIndex", index);
                            }
                        });
                    }
                   
                };
                CollabionPie.prototype.LabelLine = function (index) {
                    var points = [], midAngle, data, x1, y1, x2, y2, x3, y3, currentScope;
                    currentScope = this;
                    if (currentScope.updatedPieData[index].labelSlotIndex != undefined && currentScope.updatedPieData[index].labelSlotIndex != null) {
                        if (currentScope.updatedPieData[index].labelSlotIndex > -1) {
                            if (currentScope.slotArray[parseInt(currentScope.updatedPieData[index].labelSlotIndex)].labelExist === 'no')
                                return "M 0 0";
                            else {
                                midAngle = currentScope.updatedPieData[index].midAngle;
                                x1 = currentScope.rx * Math.cos(midAngle);
                                y1 = currentScope.ry * Math.sin(midAngle);
                                if (midAngle >= 0 && midAngle <= CollabionPie.angle180) {
                                    y1 = y1 + (currentScope.data.pieThickness / 2);
                                }
                                x3 = currentScope.slotArray[parseInt(currentScope.updatedPieData[index].labelSlotIndex)].startX;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270) {
                                    x2 = x3 + 10;
                                }
                                else {
                                    x2 = x3 - 10;
                                }
                                y2 = currentScope.slotArray[parseInt(currentScope.updatedPieData[index].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2) - (currentScope.data.slotHeight / 4);
                                y3 = y2;
                                points.push("M", x1, y1, "L", x2, y2, "L", x3, y3);
                                return points.join(" ");
                            }
                        }
                        else
                            return null;
                    }
                    else
                        return null;
                };
                CollabionPie.prototype.calculateFilteredSlicePosition = function () {
                    var highlightedSlice = this.data.highlightedSlice;
                    var slices = this.data.slices;
                    var filteredPercent, startAngle, endAngle, diff, index;
                    for (var i = 0; i < highlightedSlice.length; i++) {
                        index = highlightedSlice[i].categoryOrMeasureIndex;
                        if (highlightedSlice[i].highlightValue != null && highlightedSlice[i].endAngle != null) {
                            if (i > 0 && highlightedSlice[i].categoryOrMeasureIndex == highlightedSlice[i - 1].categoryOrMeasureIndex) {
                            }
                            else {
                                startAngle = slices[index].startAngle;
                                endAngle = slices[index].endAngle;
                                filteredPercent = highlightedSlice[i].highlightValue / slices[index].value;
                                diff = endAngle < startAngle ? CollabionPie.angle360 + endAngle - startAngle : endAngle - startAngle;
                                highlightedSlice[i].startAngle = startAngle;
                                if (i < highlightedSlice.length - 1 && highlightedSlice[i + 1].categoryOrMeasureIndex == index) {
                                    var actualEndAngle = startAngle + (diff * filteredPercent) > CollabionPie.angle360 ? startAngle + (diff * filteredPercent) - CollabionPie.angle360 : startAngle + (diff * filteredPercent);
                                    if (actualEndAngle > highlightedSlice[i].endAngle) {
                                        highlightedSlice[i + 1].startAngle = highlightedSlice[i].endAngle;
                                        highlightedSlice[i + 1].endAngle = actualEndAngle;
                                    }
                                    else {
                                        highlightedSlice[i].endAngle = startAngle + (diff * filteredPercent) > CollabionPie.angle360 ? startAngle + (diff * filteredPercent) - CollabionPie.angle360 : startAngle + (diff * filteredPercent);
                                        highlightedSlice[i + 1].endAngle = null;
                                    }
                                }
                                else {
                                    highlightedSlice[i].endAngle = startAngle + (diff * filteredPercent) > CollabionPie.angle360 ? startAngle + (diff * filteredPercent) - CollabionPie.angle360 : startAngle + (diff * filteredPercent);
                                }
                            }
                        }
                        else {
                            highlightedSlice[i].startAngle = null;
                            highlightedSlice[i].endAngle = null;
                        }
                    }
                };
                CollabionPie.prototype.drawFilteredPie = function () {
                    var slicesLeftOnPieRightSide, index, pathIndex, elementsBetween90and270;
                    slicesLeftOnPieRightSide = index = 0;
                    var slices = this.data.highlightedSlice, currentScope;
                    var noOFSlices = slices.length - 1;
                    var outerSurface;
                    currentScope = this;
                    var dataIndex, rightStartIndex;
                    if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != -1) {
                        d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index).attr("transform", function () {
                            dataIndex = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index;
                            if (slices[dataIndex].clicked == "true") {
                                return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                            }
                            else
                                return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].transform;
                        });
                        //Outer & Side Elements
                        if (this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex > -1) {
                            d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].dataIndex).attr("x", function () {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex)].startX;
                            }).attr("y", function (d, i) {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                            }).text(currentScope.labelText(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                var midAngle;
                                midAngle = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                    return 'end';
                                else
                                    return 'start';
                            });
                        }
                        else {
                            d3.select(this.outerSurface[0][index]).select("text").text(null);
                        }
                        d3.select(currentScope.outerSurface[0][index]).selectAll("path").each(function () {
                            if (d3.select(this).attr("class") == "pointingLine") {
                                if (currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].dataLabelStatus == "on") {
                                    d3.select(this).attr("index", function (d, i) {
                                        return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index;
                                    }).attr("d", currentScope.LabelLine(CollabionPie1482191307239.indexMappingSlicePosition.elementAt270));
                                }
                                else {
                                    d3.select(this).attr("d", null);
                                }
                            }
                        });
                        if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].highlightValue != null) {
                            d3.select(currentScope.outerSurface[0][index]).selectAll("path").each(function () {
                                outerSurface = currentScope.pieOuter(slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270]);
                                if (d3.select(this).attr("pos") === "first") {
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuter;
                                    }).style("fill", function () {
                                        return currentScope.outerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.outerSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").style("stroke", d3.rgb(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color).toString()).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                                else if (d3.select(this).attr("pos") === "second") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270], "left");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.leftSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                                else if (d3.select(this).attr("pos") === "third") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270], "right");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.rightSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                                else if (d3.select(this).attr("class") === "outerEdgeGradientPath") {
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuterEdgeLight;
                                    }).style("fill", function () {
                                        return currentScope.edgeGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.outerSurfaceColor, currentScope);
                                    }).style("stroke", currentScope.edgeGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].color.outerSurfaceColor, currentScope)).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                            });
                        }
                        index++;
                    }
                    pathIndex = 0;
                    /*LEFT SIDE ELEMENT */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex != -1 && CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex != -1) {
                        elementsBetween90and270 = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex < CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex ? CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + this.updatedPieData.length - CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex - CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex);
                        pathIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex;
                        while (elementsBetween90and270 >= 0) {
                            //Outer & Side Elements
                            d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[pathIndex].index).attr("transform", function () {
                                dataIndex = currentScope.updatedPieData[pathIndex].index;
                                if (slices[dataIndex].clicked == "true") {
                                    return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                                }
                                else
                                    return currentScope.updatedPieData[pathIndex].transform;
                            });
                            if (this.updatedPieData[pathIndex].labelSlotIndex > -1) {
                                d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[pathIndex].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[pathIndex].labelSlotIndex)].startX).attr("y", function (d, i) {
                                    return currentScope.slotArray[parseInt(currentScope.updatedPieData[pathIndex].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                                }).text(currentScope.labelText(currentScope.updatedPieData[pathIndex])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                    var midAngle;
                                    midAngle = currentScope.updatedPieData[pathIndex].midAngle;
                                    if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                        return 'end';
                                    else
                                        return 'start';
                                });
                            }
                            else {
                                d3.select(this.outerSurface[0][index]).select("text").text(null);
                            }
                            d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                                if (d3.select(this).attr("class") == "pointingLine")
                                    if (currentScope.updatedPieData[pathIndex].dataLabelStatus == "on") {
                                        d3.select(this).attr("index", function (d, i) {
                                            return currentScope.updatedPieData[pathIndex].index;
                                        }).attr("d", currentScope.LabelLine(pathIndex));
                                    }
                                    else {
                                        d3.select(this).attr("d", null);
                                    }
                            });
                            if (slices[pathIndex].highlightValue != null && slices[pathIndex].endAngle != null) {
                                d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                                    outerSurface = currentScope.pieOuter(slices[pathIndex]);
                                    if (d3.select(this).attr("pos") == "first") {
                                        d3.select(this).attr("d", function () {
                                            return currentScope.pieSide(slices[pathIndex], "left");
                                        }).style("fill", function () {
                                            return currentScope.innerSurfaceGradient(currentScope.updatedPieData[pathIndex].color.leftSurfaceColor, currentScope);
                                        }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") == "second") {
                                        var color = currentScope.outerSurfaceGradient(currentScope.updatedPieData[pathIndex].color.outerSurfaceColor, currentScope);
                                        d3.select(this).attr("d", function () {
                                            return outerSurface.pieOuter;
                                        }).style("fill", function () {
                                            return color;
                                        }).style("fill-opacity", "1").style("stroke", color).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") == "third") {
                                        d3.select(this).attr("d", function () {
                                            return currentScope.pieSide(slices[pathIndex], "right");
                                        }).style("fill", function () {
                                            return currentScope.innerSurfaceGradient(currentScope.updatedPieData[pathIndex].color.rightSurfaceColor, currentScope);
                                        }).style("fill-opacity", "1").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    else if (d3.select(this).attr("class") == "outerEdgeGradientPath") {
                                        var color = currentScope.edgeGradient(currentScope.updatedPieData[pathIndex].color.outerSurfaceColor, currentScope);
                                        d3.select(this).attr("d", function () {
                                            return outerSurface.pieOuterEdgeLight;
                                        }).style("fill", function () {
                                            return color;
                                        }).style("stroke", color).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    if (d3.select(this).attr("class") == "pointingLine")
                                        if (currentScope.updatedPieData[pathIndex].dataLabelStatus == "on") {
                                            d3.select(this).attr("index", function (d, i) {
                                                return currentScope.updatedPieData[pathIndex].index;
                                            }).attr("d", currentScope.LabelLine(pathIndex));
                                        }
                                        else {
                                            d3.select(this).attr("d", null);
                                        }
                                });
                            }
                            index++;
                            elementsBetween90and270--;
                            pathIndex = (pathIndex - 1) < 0 ? this.updatedPieData.length - 1 : pathIndex - 1;
                        }
                    }
                    pathIndex = 0;
                    slicesLeftOnPieRightSide = (this.updatedPieData.length) - index - (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 == -1 ? 0 : 1);
                    /*ELEMENT AT RIGHT SIDE */
                    rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex;
                    if (rightStartIndex != -1 && CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex != -1) {
                        while (pathIndex < slicesLeftOnPieRightSide) {
                            //Outer & Side Elements 
                            d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index).attr("transform", function () {
                                dataIndex = currentScope.updatedPieData[rightStartIndex].index;
                                if (slices[dataIndex].clicked == "true") {
                                    return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                                }
                                else
                                    return currentScope.updatedPieData[rightStartIndex].transform;
                            });
                            if (this.updatedPieData[rightStartIndex].labelSlotIndex > -1) {
                                d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[rightStartIndex].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[rightStartIndex].labelSlotIndex)].startX).attr("y", function (d, i) {
                                    return currentScope.slotArray[parseInt(currentScope.updatedPieData[rightStartIndex].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                                }).text(currentScope.labelText(currentScope.updatedPieData[rightStartIndex])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                    var midAngle;
                                    midAngle = currentScope.updatedPieData[rightStartIndex].midAngle;
                                    if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                        return 'end';
                                    else
                                        return 'start';
                                });
                            }
                            else {
                                d3.select(this.outerSurface[0][index]).select("text").text(null);
                            }
                            d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                                if (d3.select(this).attr("class") == "pointingLine")
                                    if (currentScope.updatedPieData[rightStartIndex].dataLabelStatus == "on") {
                                        d3.select(this).attr("index", function (d, i) {
                                            return currentScope.updatedPieData[rightStartIndex].index;
                                        }).attr("d", currentScope.LabelLine(rightStartIndex));
                                    }
                                    else {
                                        d3.select(this).attr("d", null);
                                    }
                            });
                            if (slices[rightStartIndex].highlightValue != null && slices[rightStartIndex].endAngle != null) {
                                d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                                    outerSurface = currentScope.pieOuter(slices[rightStartIndex]);
                                    if (d3.select(this).attr("pos") === "first") {
                                        d3.select(this).attr("d", function () {
                                            return currentScope.pieSide(slices[rightStartIndex], "right");
                                        }).style("fill", function () {
                                            return currentScope.innerSurfaceGradient(currentScope.updatedPieData[rightStartIndex].color.rightSurfaceColor, currentScope);
                                        }).style("fill-opacity", "1").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index).attr("class", "right");
                                    }
                                    else if (d3.select(this).attr("pos") === "second") {
                                        var color = currentScope.outerSurfaceGradient(currentScope.updatedPieData[rightStartIndex].color.outerSurfaceColor, currentScope);
                                        d3.select(this).attr("d", function () {
                                            return outerSurface.pieOuter;
                                        }).style("fill", function () {
                                            return color;
                                        }).style("fill-opacity", "1").style("stroke", color).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") === "third") {
                                        d3.select(this).attr("d", function () {
                                            return currentScope.pieSide(slices[rightStartIndex], "left");
                                        }).style("fill", function () {
                                            return currentScope.innerSurfaceGradient(currentScope.updatedPieData[rightStartIndex].color.leftSurfaceColor, currentScope);
                                        }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                    }
                                    else if (d3.select(this).attr("class") === "outerEdgeGradientPath") {
                                        var color = currentScope.edgeGradient(currentScope.updatedPieData[rightStartIndex].color.outerSurfaceColor, currentScope);
                                        d3.select(this).attr("d", function () {
                                            return outerSurface.pieOuterEdgeLight;
                                        }).style("fill", function () {
                                            return color;
                                        }).style("stroke", color).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                    }
                                });
                            }
                            index++;
                            pathIndex++;
                            rightStartIndex = rightStartIndex + 1 > this.updatedPieData.length - 1 ? 0 : rightStartIndex + 1;
                        }
                    }
                    /*ELEMENT AT 90 */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != -1) {
                        //Outer & Side Elements
                        d3.select(this.outerSurface[0][index]).attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index).attr("transform", function () {
                            dataIndex = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index;
                            if (slices[dataIndex].clicked == "true") {
                                return currentScope.translateTo(slices[dataIndex], dataIndex, slices[dataIndex].clicked);
                            }
                            else
                                return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].transform;
                        });
                        if (this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex > -1) {
                            d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex)].startX).attr("y", function (d, i) {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                            }).text(currentScope.labelText(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                var midAngle;
                                midAngle = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                    return 'end';
                                else
                                    return 'start';
                            });
                        }
                        else {
                            d3.select(this.outerSurface[0][index]).select("text").text(null);
                        }
                        d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                            if (d3.select(this).attr("class") == "pointingLine")
                                if (currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].dataLabelStatus == "on") {
                                    d3.select(this).attr("index", function (d, i) {
                                        return currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index;
                                    }).attr("d", currentScope.LabelLine(CollabionPie1482191307239.indexMappingSlicePosition.elementAt90));
                                }
                                else {
                                    d3.select(this).attr("d", null);
                                }
                        });
                        if (slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].highlightValue != null) {
                            d3.select(this.outerSurface[0][index]).selectAll("path").each(function () {
                                outerSurface = currentScope.pieOuter(slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90]);
                                if (d3.select(this).attr("pos") === "first") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90], "left");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.leftSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                                else if (d3.select(this).attr("pos") === "second") {
                                    d3.select(this).attr("d", function () {
                                        return currentScope.pieSide(slices[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90], "right");
                                    }).style("fill", function () {
                                        return currentScope.innerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.rightSurfaceColor, currentScope);
                                    }).style("fill-opacity", "1").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                                else if (d3.select(this).attr("pos") === "third") {
                                    var color = currentScope.outerSurfaceGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.outerSurfaceColor, currentScope);
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuter;
                                    }).style("fill", function () {
                                        return color;
                                    }).style("fill-opacity", "1").style("stroke", color).style("stroke-width", "0.1").attr("class", "outer").attr('categoryOrMeasureIndex', currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].categoryOrMeasureIndex).attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                                else if (d3.select(this).attr("class") === "outerEdgeGradientPath") {
                                    var color = currentScope.edgeGradient(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].color.outerSurfaceColor, currentScope);
                                    d3.select(this).attr("d", function () {
                                        return outerSurface.pieOuterEdgeLight;
                                    }).style("fill", function () {
                                        return color;
                                    }).style("stroke", color).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                            });
                        }
                    }
                    var highlightedSLiceIndex = 0;
                    for (index = 0; index <= this.data.slices.length - 1; index++, highlightedSLiceIndex++) {
                        //Top Element
                        var color, edgeColor;
                        var topElement;
                        var slices = this.data.slices;
                        color = currentScope.topSurfaceGradient(slices[index].color.topSurfaceColor, currentScope);
                        edgeColor = currentScope.edgeGradient(slices[index].color.topSurfaceColor, currentScope);
                        d3.select(this.top[0][index]).attr("transform", function () {
                            if (slices[index].clicked == "true") {
                                return currentScope.translateTo(slices[index], index, slices[index].clicked);
                            }
                            else
                                return slices[index].transform;
                        });
                        highlightedSLiceIndex = highlightedSLiceIndex == index ? (currentScope.data.highlightedSlice[index].categoryOrMeasureIndex == index - 1 ? highlightedSLiceIndex + 1 : highlightedSLiceIndex) : highlightedSLiceIndex;
                        currentScope.data.highlightedSlice[highlightedSLiceIndex].endAngle = highlightedSLiceIndex == index && index != currentScope.data.highlightedSlice.length - 1 ? (currentScope.data.highlightedSlice[index].categoryOrMeasureIndex == currentScope.data.highlightedSlice[index + 1].categoryOrMeasureIndex ? (currentScope.data.highlightedSlice[index + 1].endAngle != null ? currentScope.data.highlightedSlice[index + 1].endAngle : currentScope.data.highlightedSlice[index].endAngle) : currentScope.data.highlightedSlice[index].endAngle) : currentScope.data.highlightedSlice[highlightedSLiceIndex].endAngle;
                        topElement = currentScope.pieTop(currentScope.data.highlightedSlice[highlightedSLiceIndex]);
                        d3.select(this.top[0][index]).selectAll("path").each(function () {
                            if (d3.select(this).attr("class") === "topSurface") {
                                d3.select(this).attr("d", function () {
                                    return currentScope.data.highlightedSlice[highlightedSLiceIndex].highlightValue != null ? topElement.pieTop : null;
                                }).style("fill", color).style("stroke", color).style("fill-opacity", "1").style("stroke-width", "0.1").attr("pieIndex", index);
                            }
                            else {
                                d3.select(this).attr("d", function () {
                                    return topElement.pieTopEdgeLight;
                                }).style("fill", edgeColor).style("stroke", edgeColor).style("stroke-width", "0.1").attr("pieIndex", index);
                            }
                        });
                    }
                };
                CollabionPie.prototype.drawOuterGlassPie = function () {
                    var slicesLeftOnPieRightSide, index, pathIndex, elementsBetween90and270;
                    slicesLeftOnPieRightSide = index = 0;
                    var slices = this.data.slices, currentScope;
                    var filteredPieData = this.data.highlightedSlice;
                    var noOFSlices = slices.length - 1;
                    var innerSurface;
                    var outerElementGroup, innerElementGroup;
                    var dataIndex;
                    var glassColor, glassBorder;
                    var glassOpacity;
                    var elementAt90, leftEndIndex, leftStartIndex, rightEndIndex, rightStartIndex, elementAt270;
                    this.data.drawGlassSurface = true;
                    currentScope = this;
                    elementAt90 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt90;
                    elementAt270 = CollabionPie1482191307239.indexMappingSlicePosition.elementAt270;
                    leftEndIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex;
                    leftStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex;
                    glassColor = "#cccccc";
                    glassBorder = "#ededed";
                    glassOpacity = 0.3;
                    if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 != -1) {
                        //Outer & Side Elements
                        if (this.updatedPieData[elementAt270].labelSlotIndex > -1) {
                            d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].dataIndex).attr("x", function () {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex)].startX;
                            }).attr("y", function (d, i) {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                            }).text(currentScope.labelText(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                var midAngle;
                                midAngle = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].midAngle;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                    return 'end';
                                else
                                    return 'start';
                            });
                        }
                        else {
                            d3.select(this.outerSurface[0][index]).select("text").text(null);
                        }
                        innerSurface = currentScope.pieOuter(currentScope.updatedPieData[elementAt270]);
                        innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                        if (innerElementGroup[0][0] != undefined) {
                            innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                            innerElementGroup.selectAll("path").each(function () {
                                if (d3.select(this).attr("class") == "bottom") {
                                    d3.select(this).attr("class", "bottom").attr("d", function () {
                                        if (filteredPieData[elementAt270].highlightValue != null) {
                                            return null;
                                        }
                                        else {
                                            return currentScope.pieBottom(currentScope.updatedPieData[elementAt270]);
                                        }
                                    }).style("fill", function () {
                                        return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[elementAt270].index);
                                }
                                else if (d3.select(this).attr("pos") == "first") {
                                    d3.select(this).attr("d", function () {
                                        if (filteredPieData[elementAt270].highlightValue != null && filteredPieData[elementAt270].startAngle >= CollabionPie.angle180 && filteredPieData[elementAt270].startAngle <= currentScope.updatedPieData[elementAt270].endAngle) {
                                            return null;
                                        }
                                        else {
                                            return innerSurface.pieOuter;
                                        }
                                    }).style("fill", function () {
                                        return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").style("stroke", function () {
                                        return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                                    }).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                                else if (d3.select(this).attr("pos") == "second") {
                                    d3.select(this).attr("d", function () {
                                        if (filteredPieData[elementAt270].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex].index) {
                                            return null;
                                        }
                                        else {
                                            return currentScope.pieSide(currentScope.updatedPieData[elementAt270], "left");
                                        }
                                    }).style("fill", function () {
                                        return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                                else if (d3.select(this).attr("pos") == "third") {
                                    d3.select(this).attr("d", function () {
                                        if (filteredPieData[elementAt270].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index) {
                                            return null;
                                        }
                                        else {
                                            return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270], "right");
                                        }
                                    }).style("fill", function () {
                                        return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                                else if (d3.select(this).attr("class") == "outerEdgeGradientPath") {
                                    d3.select(this).attr("d", function () {
                                        return innerSurface.pieOuterEdgeLight;
                                    }).style("fill", function () {
                                        return currentScope.edgeGradient(glassColor, currentScope);
                                    }).style("stroke", currentScope.edgeGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                                }
                            });
                        }
                        else {
                            innerElementGroup = d3.select(currentScope.outerSurface[0][index]).append("g");
                            innerElementGroup.append("path").attr("class", "bottom").attr("d", function () {
                                if (filteredPieData[elementAt270].highlightValue != null) {
                                    return null;
                                }
                                else {
                                    return currentScope.pieBottom(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270]);
                                }
                            }).style("fill", function () {
                                return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            innerElementGroup.append("path").attr("pos", "first").attr("d", function () {
                                if (filteredPieData[elementAt270].highlightValue != null && filteredPieData[elementAt270].startAngle >= CollabionPie.angle180 && currentScope.data.highlightedSlice[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].startAngle <= currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].endAngle) {
                                    return null;
                                }
                                else {
                                    return innerSurface.pieOuter;
                                }
                            }).style("fill", function () {
                                return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").style("stroke", function () {
                                return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                            }).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            innerElementGroup.append("path").attr("pos", "second").attr("d", function () {
                                if (filteredPieData[elementAt270].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex].index) {
                                    return null;
                                }
                                else {
                                    return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270], "left");
                                }
                            }).style("fill", function () {
                                return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            innerElementGroup.append("path").attr("pos", "third").attr("d", function () {
                                if (filteredPieData[elementAt270].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex].index) {
                                    return null;
                                }
                                else {
                                    return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270], "right");
                                }
                            }).style("fill", function () {
                                return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                            innerElementGroup.append("path").attr("class", "outerEdgeGradientPath").attr("d", function () {
                                return innerSurface.pieOuterEdgeLight;
                            }).style("fill", function () {
                                return currentScope.edgeGradient(glassColor, currentScope);
                            }).style("stroke", currentScope.edgeGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index);
                        }
                        index++;
                    }
                    pathIndex = 0;
                    /*LEFT SIDE ELEMENT */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex != -1 && CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex != -1) {
                        elementsBetween90and270 = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex < CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex ? CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex + this.updatedPieData.length - CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex : (CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex - CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex);
                        pathIndex = CollabionPie1482191307239.indexMappingSlicePosition.leftStartIndex;
                        while (elementsBetween90and270 >= 0) {
                            //Outer & Side Elements
                            leftStartIndex = this.updatedPieData[pathIndex].index;
                            if (this.updatedPieData[pathIndex].labelSlotIndex > -1) {
                                d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[pathIndex].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[pathIndex].labelSlotIndex)].startX).attr("y", function (d, i) {
                                    return currentScope.slotArray[parseInt(currentScope.updatedPieData[pathIndex].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                                }).text(currentScope.labelText(currentScope.updatedPieData[pathIndex])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                    var midAngle;
                                    midAngle = currentScope.updatedPieData[pathIndex].midAngle;
                                    if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                        return 'end';
                                    else
                                        return 'start';
                                });
                            }
                            else {
                                d3.select(this.outerSurface[0][index]).select("text").text(null);
                            }
                            innerSurface = currentScope.pieOuter(currentScope.updatedPieData[pathIndex]);
                            innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                            if (innerElementGroup[0][0] != undefined) {
                                innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                                innerElementGroup.selectAll("path").each(function () {
                                    if (d3.select(this).attr("class") == "bottom") {
                                        d3.select(this).attr("class", "bottom").attr("d", function () {
                                            if (filteredPieData[pathIndex].highlightValue != null) {
                                                return null;
                                            }
                                            else {
                                                return currentScope.pieBottom(currentScope.updatedPieData[pathIndex]);
                                            }
                                        }).style("fill", function () {
                                            return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") == "first") {
                                        d3.select(this).attr("d", function () {
                                            if (filteredPieData[pathIndex].highlightValue != null || filteredPieData[pathIndex].endAngle == currentScope.updatedPieData[pathIndex].endAngle || CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[pathIndex].index && pathIndex != leftEndIndex) {
                                                return null;
                                            }
                                            else {
                                                return currentScope.pieSide(currentScope.updatedPieData[pathIndex], "left");
                                            }
                                        }).style("fill", function () {
                                            return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") == "second") {
                                        d3.select(this).attr("d", function () {
                                            if (filteredPieData[pathIndex].highlightValue != null && filteredPieData[pathIndex].startAngle >= CollabionPie.angle180 && filteredPieData[pathIndex].startAngle <= currentScope.updatedPieData[pathIndex].endAngle) {
                                                return null;
                                            }
                                            else {
                                                return innerSurface.pieOuter;
                                            }
                                        }).style("fill", function () {
                                            return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").style("stroke", currentScope.outerSurfaceGlassGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") == "third") {
                                        d3.select(this).attr("d", function () {
                                            if (filteredPieData[pathIndex].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[pathIndex].index) {
                                                return null;
                                            }
                                            else {
                                                return currentScope.pieSide(currentScope.updatedPieData[pathIndex], "right");
                                            }
                                        }).style("fill", function () {
                                            return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                    else if (d3.select(this).attr("class") == "outerEdgeGradientPath") {
                                        d3.select(this).attr("d", function () {
                                            return innerSurface.pieOuterEdgeLight;
                                        }).style("fill", function () {
                                            return currentScope.edgeGradient(glassColor, currentScope);
                                        }).style("stroke", d3.rgb(glassColor).toString()).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                    }
                                });
                            }
                            else {
                                innerElementGroup = d3.select(currentScope.outerSurface[0][index]).append("g");
                                innerElementGroup.append("path").attr("class", "bottom").attr("d", function () {
                                    if (filteredPieData[pathIndex].highlightValue != null) {
                                        return null;
                                    }
                                    else {
                                        return currentScope.pieBottom(currentScope.updatedPieData[pathIndex]);
                                    }
                                }).style("fill", function () {
                                    return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                innerElementGroup.append("path").attr("pos", "first").attr("d", function () {
                                    if (filteredPieData[pathIndex].highlightValue != null || filteredPieData[pathIndex].endAngle == currentScope.updatedPieData[pathIndex].endAngle || CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[pathIndex].index && pathIndex != leftEndIndex) {
                                        return null;
                                    }
                                    else {
                                        return currentScope.pieSide(currentScope.updatedPieData[pathIndex], "left");
                                    }
                                }).style("fill", function () {
                                    return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                innerElementGroup.append("path").attr("pos", "second").attr("d", function () {
                                    if (filteredPieData[pathIndex].highlightValue != null && filteredPieData[pathIndex].startAngle >= CollabionPie.angle180 && filteredPieData[pathIndex].startAngle <= currentScope.updatedPieData[pathIndex].endAngle) {
                                        return null;
                                    }
                                    else {
                                        return innerSurface.pieOuter;
                                    }
                                }).style("fill", function () {
                                    return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").style("stroke", currentScope.outerSurfaceGlassGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                innerElementGroup.append("path").attr("pos", "third").attr("d", function () {
                                    if (filteredPieData[pathIndex].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[pathIndex].index) {
                                        return null;
                                    }
                                    else {
                                        return currentScope.pieSide(currentScope.updatedPieData[pathIndex], "right");
                                    }
                                }).style("fill", function () {
                                    return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                                innerElementGroup.append("path").attr("class", "outerEdgeGradientPath").attr("d", function () {
                                    return innerSurface.pieOuterEdgeLight;
                                }).style("fill", function () {
                                    return currentScope.edgeGradient(glassColor, currentScope);
                                }).style("stroke", d3.rgb(glassColor).toString()).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[pathIndex].index);
                            }
                            index++;
                            elementsBetween90and270--;
                            pathIndex = (pathIndex - 1) < 0 ? this.updatedPieData.length - 1 : pathIndex - 1;
                        }
                    }
                    pathIndex = 0;
                    slicesLeftOnPieRightSide = (this.updatedPieData.length) - index - (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 == -1 ? 0 : 1);
                    /*ELEMENT AT RIGHT SIDE */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex != -1 && CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex != -1) {
                        rightStartIndex = CollabionPie1482191307239.indexMappingSlicePosition.rightStartIndex;
                        while (pathIndex < slicesLeftOnPieRightSide) {
                            //Outer & Side Elements 
                            if (this.updatedPieData[rightStartIndex].labelSlotIndex > -1) {
                                d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[rightStartIndex].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[rightStartIndex].labelSlotIndex)].startX).attr("y", function (d, i) {
                                    return currentScope.slotArray[parseInt(currentScope.updatedPieData[rightStartIndex].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                                }).text(currentScope.labelText(currentScope.updatedPieData[rightStartIndex])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                    var midAngle;
                                    midAngle = currentScope.updatedPieData[rightStartIndex].midAngle;
                                    if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                        return 'end';
                                    else
                                        return 'start';
                                });
                            }
                            else {
                                d3.select(this.outerSurface[0][index]).select("text").text(null);
                            }
                            innerSurface = currentScope.pieOuter(currentScope.updatedPieData[rightStartIndex]);
                            innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                            if (innerElementGroup[0][0] != undefined) {
                                innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                                innerElementGroup.selectAll("path").each(function () {
                                    if (d3.select(this).attr("class") == "bottom") {
                                        d3.select(this).attr("class", "bottom").attr("d", function () {
                                            if (filteredPieData[rightStartIndex].highlightValue != null) {
                                                return null;
                                            }
                                            else {
                                                return currentScope.pieBottom(currentScope.updatedPieData[rightStartIndex]);
                                            }
                                        }).style("fill", function () {
                                            return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") == "first") {
                                        d3.select(this).attr("d", function () {
                                            if (filteredPieData[rightStartIndex].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[rightStartIndex].index) {
                                                return null;
                                            }
                                            else {
                                                return currentScope.pieSide(currentScope.updatedPieData[rightStartIndex], "right");
                                            }
                                        }).style("fill", function () {
                                            return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index).attr("class", "right");
                                    }
                                    else if (d3.select(this).attr("pos") == "second") {
                                        d3.select(this).attr("d", function () {
                                            if (filteredPieData[rightStartIndex].highlightValue != null && filteredPieData[rightStartIndex].startAngle >= CollabionPie.angle180 && currentScope.updatedPieData[rightStartIndex].endAngle >= filteredPieData[rightStartIndex].startAngle) {
                                                return null;
                                            }
                                            else {
                                                return innerSurface.pieOuter;
                                            }
                                        }).style("fill", function () {
                                            return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                    }
                                    else if (d3.select(this).attr("pos") == "third") {
                                        d3.select(this).attr("d", function () {
                                            if (filteredPieData[rightStartIndex].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[rightStartIndex].index) {
                                                return null;
                                            }
                                            else {
                                                return currentScope.pieSide(currentScope.updatedPieData[rightStartIndex], "left");
                                            }
                                        }).style("fill", function () {
                                            return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                        }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                    }
                                    else if (d3.select(this).attr("class") == "outerEdgeGradientPath") {
                                        d3.select(this).attr("d", function () {
                                            return innerSurface.pieOuterEdgeLight;
                                        }).style("fill", function () {
                                            return currentScope.edgeGradient(glassColor, currentScope);
                                        }).style("stroke", currentScope.edgeGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                    }
                                });
                            }
                            else {
                                innerElementGroup = d3.select(currentScope.outerSurface[0][index]).append("g");
                                innerElementGroup.append("path").attr("class", "bottom").attr("d", function () {
                                    if (filteredPieData[rightStartIndex].highlightValue != null) {
                                        return null;
                                    }
                                    else {
                                        return currentScope.pieBottom(currentScope.updatedPieData[rightStartIndex]);
                                    }
                                }).style("fill", function () {
                                    return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                innerElementGroup.append("path").attr("pos", "first").attr("d", function () {
                                    if (filteredPieData[rightStartIndex].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.elementAt270 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt270].index == currentScope.updatedPieData[rightStartIndex].index) {
                                        return null;
                                    }
                                    else {
                                        return currentScope.pieSide(currentScope.updatedPieData[rightStartIndex], "right");
                                    }
                                }).style("fill", function () {
                                    return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index).attr("class", "right");
                                innerElementGroup.append("path").attr("pos", "second").attr("d", function () {
                                    if (filteredPieData[rightStartIndex].highlightValue != null && filteredPieData[rightStartIndex].startAngle >= CollabionPie.angle180 && currentScope.updatedPieData[rightStartIndex].endAngle >= filteredPieData[rightStartIndex].startAngle) {
                                        return null;
                                    }
                                    else {
                                        return innerSurface.pieOuter;
                                    }
                                }).style("fill", function () {
                                    return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").style("stroke", currentScope.outerSurfaceGlassGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                innerElementGroup.append("path").attr("pos", "third").attr("d", function () {
                                    if (filteredPieData[rightStartIndex].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[rightStartIndex].index) {
                                        return null;
                                    }
                                    else {
                                        return currentScope.pieSide(currentScope.updatedPieData[rightStartIndex], "left");
                                    }
                                }).style("fill", function () {
                                    return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                                innerElementGroup.append("path").attr("class", "outerEdgeGradientPath").attr("d", function () {
                                    return innerSurface.pieOuterEdgeLight;
                                }).style("fill", function () {
                                    return currentScope.edgeGradient(glassColor, currentScope);
                                }).style("stroke", currentScope.edgeGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("class", "outerEdgeGradientPath").attr("pieIndex", currentScope.updatedPieData[rightStartIndex].index);
                            }
                            index++;
                            pathIndex++;
                            rightStartIndex = rightStartIndex + 1 > this.updatedPieData.length - 1 ? 0 : rightStartIndex + 1;
                        }
                    }
                    /*ELEMENT AT 90 */
                    if (CollabionPie1482191307239.indexMappingSlicePosition.elementAt90 != -1) {
                        //Outer & Side Elements
                        if (this.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex > -1) {
                            d3.select(this.outerSurface[0][index]).select("text").attr("index", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].dataIndex).attr("x", currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex)].startX).attr("y", function (d, i) {
                                return currentScope.slotArray[parseInt(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].labelSlotIndex)].startY + (currentScope.data.pieThickness / 2);
                            }).text(currentScope.labelText(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90])).style("fill", this.data.dataLabelsSettings.labelColor).style("font-size", this.data.dataLabelsSettings.fontSize).attr("text-anchor", function (d, i) {
                                var midAngle;
                                midAngle = currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].midAngle;
                                if (midAngle > CollabionPie.angle90 && midAngle <= CollabionPie.angle270)
                                    return 'end';
                                else
                                    return 'start';
                            });
                        }
                        else {
                            d3.select(this.outerSurface[0][index]).select("text").text(null);
                        }
                        innerSurface = currentScope.pieOuter(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90]);
                        innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                        if (innerElementGroup[0][0] != undefined) {
                            innerElementGroup = d3.select(currentScope.outerSurface[0][index]).select("g");
                            innerElementGroup.selectAll("path").each(function () {
                                if (d3.select(this).attr("class") == "bottom") {
                                    d3.select(this).attr("class", "bottom").attr("d", function () {
                                        if (filteredPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].highlightValue != null) {
                                            return null;
                                        }
                                        else {
                                            return currentScope.pieBottom(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90]);
                                        }
                                    }).style("fill", function () {
                                        return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                                else if (d3.select(this).attr("pos") == "first") {
                                    d3.select(this).attr("d", function () {
                                        if (filteredPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex].index) {
                                            return null;
                                        }
                                        else {
                                            return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90], "left");
                                        }
                                    }).style("fill", function () {
                                        return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                                else if (d3.select(this).attr("pos") == "second") {
                                    d3.select(this).attr("d", function () {
                                        if (filteredPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex].index) {
                                            return null;
                                        }
                                        else {
                                            return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90], "right");
                                        }
                                    }).style("fill", function () {
                                        return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                                else if (d3.select(this).attr("pos") == "third") {
                                    d3.select(this).attr("d", function () {
                                        return innerSurface.pieOuter;
                                    }).style("fill", function () {
                                        return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                                    }).style("fill-opacity", "0.5").style("stroke", currentScope.outerSurfaceGlassGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                                else if (d3.select(this).attr("class") == "outerEdgeGradientPath") {
                                    d3.select(this).attr("d", function () {
                                        return innerSurface.pieOuterEdgeLight;
                                    }).style("fill", function () {
                                        return currentScope.edgeGradient(glassColor, currentScope);
                                    }).style("stroke", currentScope.edgeGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                                }
                            });
                        }
                        else {
                            innerElementGroup = d3.select(currentScope.outerSurface[0][index]).append("g");
                            innerElementGroup.append("path").attr("class", "bottom").attr("d", function () {
                                if (filteredPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].highlightValue != null) {
                                    return null;
                                }
                                else {
                                    return currentScope.pieBottom(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90]);
                                }
                            }).style("fill", function () {
                                return currentScope.bottomGlassSurfaceGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").style("stroke", glassBorder).style("stroke-width", "0.7").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            innerElementGroup.append("path").attr("pos", "first").attr("d", function () {
                                if (filteredPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.leftEndIndex].index) {
                                    return null;
                                }
                                else {
                                    return currentScope.pieSide(currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90], "left");
                                }
                            }).style("fill", function () {
                                return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").attr("class", "left").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            innerElementGroup.append("path").attr("pos", "second").attr("d", function () {
                                if (filteredPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].highlightValue != null || CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex >= 0 && currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index == currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.rightEndIndex].index) {
                                    return null;
                                }
                                else {
                                    return currentScope.pieSide(currentScope.updatedPieData[elementAt90], "right");
                                }
                            }).style("fill", function () {
                                return currentScope.innerGlassSurfaceGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").attr("class", "right").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            innerElementGroup.append("path").attr("pos", "third").attr("d", function () {
                                return innerSurface.pieOuter;
                            }).style("fill", function () {
                                return currentScope.outerSurfaceGlassGradient(glassColor, currentScope);
                            }).style("fill-opacity", "0.5").style("stroke", currentScope.outerSurfaceGlassGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("class", "outer").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                            innerElementGroup.append("path").attr("class", "outerEdgeGradientPath").attr("d", function () {
                                return innerSurface.pieOuterEdgeLight;
                            }).style("fill", function () {
                                return currentScope.edgeGradient(glassColor, currentScope);
                            }).style("stroke", currentScope.edgeGradient(glassColor, currentScope)).style("stroke-width", "0.1").attr("pieIndex", currentScope.updatedPieData[CollabionPie1482191307239.indexMappingSlicePosition.elementAt90].index);
                        }
                    }
                    var color, edgeColor, innerSurfaceColor, innerEdgeColor;
                    var topElement;
                    var innerTopElement;
                    var topElementGroup, filteredTopElement;
                    for (index = 0; index <= noOFSlices; index++) {
                        //Top Element
                        innerTopElement = currentScope.pieTop(slices[index]);
                        color = currentScope.topSurfaceGradient(glassColor, currentScope);
                        edgeColor = currentScope.edgeGradient(glassColor, currentScope);
                        innerSurfaceColor = glassColor;
                        innerEdgeColor = glassColor;
                        filteredTopElement = d3.select(this.top[0][index]).select("g");
                        if (filteredTopElement[0][0] != undefined) {
                            filteredTopElement = d3.select(this.top[0][index]).select("g");
                            filteredTopElement.selectAll("path").each(function () {
                                if (d3.select(this).attr("class") == "filteredTopSurface") {
                                    d3.select(this).attr("d", function () {
                                        return innerTopElement.pieTop;
                                    }).style("fill", innerSurfaceColor).style("stroke", innerSurfaceColor).style("fill-opacity", "0.5").style("stroke-width", "0.1").attr("pieIndex", index);
                                }
                                else if (d3.select(this).attr("class") == "filteredEdgeLight") {
                                    d3.select(this).attr("d", function () {
                                        return innerTopElement.pieTopEdgeLight;
                                    }).style("fill", innerEdgeColor).style("stroke", innerEdgeColor).style("stroke-width", "0.1").attr("pieIndex", index);
                                }
                            });
                        }
                        else {
                            filteredTopElement = d3.select(this.top[0][index]).append("g");
                            filteredTopElement.append("path").attr("class", "filteredTopSurface").attr("d", function () {
                                return innerTopElement.pieTop;
                            }).style("fill", innerSurfaceColor).style("stroke", innerSurfaceColor).style("fill-opacity", "0.5").style("stroke-width", "0.1").attr("pieIndex", index);
                            filteredTopElement.append("path").attr("class", "filteredEdgeLight").attr("d", function () {
                                return innerTopElement.pieTopEdgeLight;
                            }).style("fill", innerEdgeColor).style("stroke", innerEdgeColor).style("stroke-width", "0.1").attr("pieIndex", index);
                        }
                    }
                };
                CollabionPie.prototype.outerSurfaceGradient = function (color, currentScope) {
                    var gradient = currentScope.defs.append("linearGradient").attr("id", "gradient" + color).attr("x1", CollabionPie.linearGradientForPie.x1).attr("y1", CollabionPie.linearGradientForPie.y1).attr("x2", CollabionPie.linearGradientForPie.x2).attr("y2", CollabionPie.linearGradientForPie.y1).attr("spreadMethod", "pad").attr("gradientUnits", "userSpaceOnUse");
                    gradient.append("stop").attr("offset", "0%").attr("stop-color", d3.rgb(color).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "30%").attr("stop-color", d3.rgb(color).brighter(1.5).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "45%").attr("stop-color", d3.rgb(color).brighter(2.3).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "60%").attr("stop-color", d3.rgb(color).brighter(1.5).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "100%").attr("stop-color", d3.rgb(color).toString()).attr("stop-opacity", 1);
                    return ("url(" + window.location.href + "#gradient" + color + ")");
                };
                CollabionPie.prototype.outerSurfaceGlassGradient = function (color, currentScope) {
                    var gradient = currentScope.defs.append("linearGradient").attr("id", "outerSurfaceGlassGradient" + color).attr("x1", CollabionPie.linearGradientForPie.x1).attr("y1", CollabionPie.linearGradientForPie.y1).attr("x2", CollabionPie.linearGradientForPie.x2).attr("y2", CollabionPie.linearGradientForPie.y1).attr("spreadMethod", "pad").attr("gradientUnits", "userSpaceOnUse");
                    gradient.append("stop").attr("offset", "0%").attr("stop-color", d3.rgb(color).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "30%").attr("stop-color", d3.rgb(color).brighter(0.1).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "45%").attr("stop-color", d3.rgb(color).brighter(0.5).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "60%").attr("stop-color", d3.rgb(color).brighter(0.1).toString()).attr("stop-opacity", 1);
                    gradient.append("stop").attr("offset", "100%").attr("stop-color", d3.rgb(color).toString()).attr("stop-opacity", 1);
                    return ("url(" + window.location.href + "#outerSurfaceGlassGradient" + color + ")");
                };
                CollabionPie.prototype.edgeGradient = function (color, currentScope) {
                    var gradient = currentScope.defs.append("linearGradient").attr("id", "edgeGradient" + color).attr("x1", CollabionPie.linearGradientForPie.x1).attr("y1", CollabionPie.linearGradientForPie.y1).attr("x2", CollabionPie.linearGradientForPie.x2).attr("y2", CollabionPie.linearGradientForPie.y1).attr("spreadMethod", "pad").attr("gradientUnits", "userSpaceOnUse");
                    gradient.append("stop").attr("offset", "0%").attr("stop-color", d3.rgb(color).brighter(0.2).toString()).attr("stop-opacity", 0.5);
                    gradient.append("stop").attr("offset", "45%").attr("stop-color", d3.rgb("white").toString()).attr("stop-opacity", 0.3);
                    gradient.append("stop").attr("offset", "100%").attr("stop-color", d3.rgb(color).brighter(0.2).toString()).attr("stop-opacity", 0.5);
                    return ("url(" + window.location.href + "#edgeGradient" + color + ")");
                };
                CollabionPie.prototype.topSurfaceGradient = function (color, currentScope) {
                    var topGradient = currentScope.defs.append("radialGradient").attr("id", "topGradient" + color).attr("cx", CollabionPie.radialGradientForPie.cx).attr("cy", CollabionPie.radialGradientForPie.cy).attr("fx", CollabionPie.radialGradientForPie.fx).attr("fy", CollabionPie.radialGradientForPie.fy).attr("r", CollabionPie.radialGradientForPie.r).attr("spreadMethod", "pad").attr("gradientUnits", "userSpaceOnUse");
                    topGradient.append("stop").attr("offset", "0%").attr("stop-color", d3.rgb(color).brighter(2).toString()).attr("stop-opacity", 1);
                    topGradient.append("stop").attr("offset", "15%").attr("stop-color", d3.rgb(color).brighter(1.5).toString()).attr("stop-opacity", 1);
                    topGradient.append("stop").attr("offset", "65%").attr("stop-color", d3.rgb(color).brighter(0.5).toString()).attr("stop-opacity", 1);
                    topGradient.append("stop").attr("offset", "75%").attr("stop-color", d3.rgb(color).brighter(0).toString()).attr("stop-opacity", 1);
                    return ("url(" + window.location.href + "#topGradient" + color + ")");
                };
                CollabionPie.prototype.bottomGlassSurfaceGradient = function (color, currentScope) {
                    var topGradient = currentScope.defs.append("radialGradient").attr("id", "bottomGlassGradient" + color).attr("cx", CollabionPie.radialGradientForPie.cx).attr("cy", CollabionPie.radialGradientForPie.cy).attr("fx", CollabionPie.radialGradientForPie.fx).attr("fy", CollabionPie.radialGradientForPie.fy).attr("r", CollabionPie.radialGradientForPie.r).attr("spreadMethod", "pad").attr("gradientUnits", "userSpaceOnUse");
                    topGradient.append("stop").attr("offset", "0%").attr("stop-color", d3.rgb(color).brighter(0.9).toString()).attr("stop-opacity", 1);
                    topGradient.append("stop").attr("offset", "15%").attr("stop-color", d3.rgb(color).brighter(0.6).toString()).attr("stop-opacity", 1);
                    topGradient.append("stop").attr("offset", "65%").attr("stop-color", d3.rgb(color).brighter(0.3).toString()).attr("stop-opacity", 1);
                    topGradient.append("stop").attr("offset", "75%").attr("stop-color", d3.rgb(color).brighter(0).toString()).attr("stop-opacity", 1);
                    return ("url(" + window.location.href + "#bottomGlassGradient" + color + ")");
                };
                CollabionPie.prototype.innerSurfaceGradient = function (color, currentScope) {
                    var innerGradient = currentScope.defs.append("radialGradient").attr("id", "innerGradient" + color).attr("cx", CollabionPie.radialGradientForPie.cx).attr("cy", CollabionPie.radialGradientForPie.cy).attr("fx", CollabionPie.radialGradientForPie.fx).attr("fy", CollabionPie.radialGradientForPie.fy).attr("r", CollabionPie.radialGradientForPie.r).attr("spreadMethod", "pad").attr("gradientUnits", "userSpaceOnUse");
                    innerGradient.append("stop").attr("offset", "0%").attr("stop-color", d3.rgb(color).brighter(1.8).toString()).attr("stop-opacity", 1);
                    innerGradient.append("stop").attr("offset", "25%").attr("stop-color", d3.rgb(color).brighter(1.3).toString()).attr("stop-opacity", 1);
                    innerGradient.append("stop").attr("offset", "45%").attr("stop-color", d3.rgb(color).brighter(0.5).toString()).attr("stop-opacity", 1);
                    innerGradient.append("stop").attr("offset", "55%").attr("stop-color", d3.rgb(color).brighter(0).toString()).attr("stop-opacity", 1);
                    return ("url(" + window.location.href + "#innerGradient" + color + ")");
                };
                CollabionPie.prototype.innerGlassSurfaceGradient = function (color, currentScope) {
                    var innerGradient = currentScope.defs.append("radialGradient").attr("id", "innerGlassGradient" + color).attr("cx", CollabionPie.radialGradientForPie.cx).attr("cy", CollabionPie.radialGradientForPie.cy).attr("fx", CollabionPie.radialGradientForPie.fx).attr("fy", CollabionPie.radialGradientForPie.fy).attr("r", CollabionPie.radialGradientForPie.r).attr("spreadMethod", "pad").attr("gradientUnits", "userSpaceOnUse");
                    innerGradient.append("stop").attr("offset", "0%").attr("stop-color", d3.rgb(color).brighter(0.15).toString()).attr("stop-opacity", 1);
                    innerGradient.append("stop").attr("offset", "25%").attr("stop-color", d3.rgb(color).brighter(0.1).toString()).attr("stop-opacity", 1);
                    innerGradient.append("stop").attr("offset", "45%").attr("stop-color", d3.rgb(color).brighter(0.05).toString()).attr("stop-opacity", 1);
                    innerGradient.append("stop").attr("offset", "55%").attr("stop-color", d3.rgb(color).brighter(0).toString()).attr("stop-opacity", 1);
                    return ("url(" + window.location.href + "#innerGlassGradient" + color + ")");
                };
                CollabionPie.prototype.enumerateObjectInstances = function (options) {
                    var enumeration = new visuals.ObjectEnumerationBuilder();
                    switch (options.objectName) {
                        case 'dataPoint':
                            this.enumerateDataPoints(enumeration);
                            break;
                        case 'labels':
                            var labelSettingsOptions = CollabionPie.getLabelSettingsOptions(enumeration, this.data.dataLabelsSettings);
                            visuals.dataLabelUtils.enumerateDataLabels(labelSettingsOptions);
                            break;
                    }
                    return enumeration.complete();
                };
                CollabionPie.prototype.enumerateDataPoints = function (enumeration) {
                    var data = this.data;
                    if (!data)
                        return;
                    var slices = data.slices;
                    for (var i = 0; i < slices.length; i++) {
                        var slice = slices[i];
                        if (slice.highlight)
                            continue;
                        var color = slice.color.baseColor;
                        var selector = slice.identity.getSelector();
                        var isSingleSeries = !!selector.data;
                        enumeration.pushInstance({
                            objectName: 'dataPoint',
                            displayName: slice.labeltext,
                            selector: visuals.ColorHelper.normalizeSelector(selector, isSingleSeries),
                            properties: {
                                fill: { solid: { color: color } }
                            },
                        });
                    }
                };
                CollabionPie.getLabelSettingsOptions = function (enumeration, labelSettings) {
                    return {
                        enumeration: enumeration,
                        dataLabelsSettings: labelSettings,
                        show: true,
                        fontSize: true
                    };
                };
                CollabionPie.VisualClassName = 'collabionPieChart';
                CollabionPie.PyramidSlicesClassName = 'collabionPieSlices';
                CollabionPie.defaultDataPointColor = undefined;
                CollabionPie.rightSurfaceDarknessFactor = 1.5;
                CollabionPie.outerSurfaceDarknessFactor = 1;
                CollabionPie.leftSurfaceDarknessFactor = 1.5;
                CollabionPie.topSurfaceDarknessFactor = 1;
                CollabionPie.linearGradientForPie = {
                    x1: null,
                    y1: null,
                    x2: null,
                    y2: null
                };
                CollabionPie.radialGradientForPie = {
                    cx: null,
                    cy: null,
                    fx: null,
                    fy: null,
                    r: null
                };
                CollabionPie.total = 0;
                CollabionPie.capabilities = {
                    dataRoles: [{
                        name: 'Category',
                        kind: powerbi.VisualDataRoleKind.Grouping,
                        displayName: 'Group',
                        description: 'Each field is a stage in Pie'
                    }, {
                        name: 'Y',
                        kind: powerbi.VisualDataRoleKind.Measure,
                        displayName: 'Value',
                        description: 'Values for the Visual',
                        requiredTypes: [{ numeric: true }, { integer: true }],
                    }],
                    dataViewMappings: [{
                        conditions: [
                            { 'Category': { max: 0 } },
                            { 'Category': { max: 1 }, 'Y': { max: 1 } },
                            { 'Category': { max: 0 }, 'Y': { min: 1 } }
                        ],
                        categorical: {
                            categories: {
                                for: { in: 'Category' },
                                dataReductionAlgorithm: { top: {} }
                            },
                            values: {
                                select: [{ for: { in: 'Y' } }],
                                dataReductionAlgorithm: { top: {} }
                            },
                            rowCount: { preferred: { min: 1 } }
                        }
                    }],
                    objects: {
                        general: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_General'),
                            properties: {
                                formatString: {
                                    type: { formatting: { formatString: true } }
                                }
                            }
                        },
                        dataPoint: {
                            displayName: 'Color',
                            description: 'Color for each slice of Pie',
                            properties: {
                                fill: {
                                    displayName: powerbi.data.createDisplayNameGetter('Visual_Fill'),
                                    type: { fill: { solid: { color: true } } }
                                }
                            }
                        },
                        labels: {
                            displayName: 'DataPoint Label',
                            description: 'Label settings for slices ',
                            properties: {
                                show: {
                                    displayName: powerbi.data.createDisplayNameGetter('Visual_Show'),
                                    type: { bool: true }
                                },
                                color: {
                                    displayName: powerbi.data.createDisplayNameGetter('Visual_LabelsFill'),
                                    description: powerbi.data.createDisplayNameGetter('Visual_LabelsFillDescription'),
                                    type: { fill: { solid: { color: true } } }
                                },
                                fontSize: {
                                    displayName: powerbi.data.createDisplayNameGetter('Visual_TextSize'),
                                    type: { formatting: { fontSize: true } }
                                }
                            }
                        }
                    },
                    supportsHighlight: true,
                    sorting: {
                        default: {},
                    },
                    drilldown: {
                        roles: ['Category']
                    }
                };
                return CollabionPie;
            })();
            CollabionPie1482191307239.CollabionPie = CollabionPie;
        })(CollabionPie1482191307239 = visuals.CollabionPie1482191307239 || (visuals.CollabionPie1482191307239 = {}));
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var plugins;
        (function (plugins) {
            plugins.CollabionPie1482191307239 = {
                name: 'CollabionPie1482191307239',
                class: 'CollabionPie1482191307239',
                capabilities: powerbi.visuals.CollabionPie1482191307239.CollabionPie.capabilities,
                custom: true,
                create: function (options) { return new powerbi.visuals.CollabionPie1482191307239.CollabionPie(options); },
                apiVersion: null
            };
        })(plugins = visuals.plugins || (visuals.plugins = {}));
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));
