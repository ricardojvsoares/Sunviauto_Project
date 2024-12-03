# **Power BI Dashboards Optimization and Data Warehouse Integration**

---

## **Overview**  
This project showcases the development, optimization, and integration of interactive dashboards in **Power BI**, designed to centralize and analyze business data for **Sunviauto - Automotive Components Industry**. By integrating Power BI with a centralized Data Warehouse, the project delivers robust analytics capabilities and dynamic visualizations to facilitate data-driven decision-making.

---

## **Key Features**
- 🎯 **Centralized Data**:  
  Unified data sourced from SQL Server, Excel files, and alternative systems like PLC and DSP.
- 📊 **Dynamic Visualizations**:  
  Over 60 optimized dashboards tailored for different departments.
- 🚀 **Performance Optimization**:  
  Improved data load times and query responsiveness using ETL (Extract, Transform, Load) and DAX optimization.
- 🖥️ **User-Centric Design**:  
  Intuitive layouts and interactivity designed for diverse organizational roles.

---

## **Tools and Technologies**
- **[Power BI](https://powerbi.microsoft.com/)**: For creating dashboards and data visualizations.  
- **SQL Server**: The primary data source for the Data Warehouse.  
- **[DAX Studio](https://daxstudio.org/)**: For analyzing and optimizing DAX queries.  
- **Power Query**: Used for data transformation and connection.

---

## **Project Architecture**
- **Data Sources**:  
  - **Primary**: SQL Server (BI Database).  
  - **Secondary**: Excel files for budgeting, and systems like PLC and DSP.  
- **Dynamic Parameters**:  
  - Parameters for server and database configuration ensure adaptability to changes.  
- **ETL Processes**:  
  - Tailored queries import only essential data to optimize performance.

---

## **Project Structure**
1. **Data Preparation**:  
   Data consolidation, cleaning, and loading into the Data Warehouse.  
2. **Dashboard Development**:  
   Building visually consistent and user-friendly dashboards.  
3. **Performance Testing**:  
   Optimization of queries and calculations for responsive interactions.  
4. **Documentation**:  
   Comprehensive guides for maintenance and future scalability.

---

## **Key Achievements**
- ⏳ **Performance Gains**:  
  - Reduced average data load time from **93.67 seconds** to **25.32 seconds**.  
- 📈 **Comprehensive Dashboards**:  
  - Created over **60 dashboards**, each tailored to departmental needs.  
- 🔗 **Scalable Design**:  
  - Introduced dynamic parameters for seamless adaptability.  
- 📚 **Standardized Practices**:  
  - Implemented consistent naming conventions to enhance model clarity.

---

## **How to Use**
### **Clone the Repository**:  
   ```bash
   git clone <repository_url>
   ```

### **Install Required Tools**  
- Ensure **Power BI Desktop** and **DAX Studio** are installed on your system.  

### **Connect to Data Sources**  
- Update connection parameters in the `.pbix` Power BI files to match your **SQL Server configuration**.

### **Explore Dashboards**  
- Open `.pbix` files in **Power BI Desktop** and interact with the visualizations.  

### **Update Data**  
- Use the **Refresh** button in Power BI to fetch the latest data from connected sources.  

---

## **Project Documentation**  

Documentation is available in the `docs/` folder, including:  

- **Setup Instructions**:  
  Step-by-step guide for configuring data connections.  

- **Maintenance Guide**:  
  Tips for troubleshooting and updating dashboards.  

- **Technical Details**:  
  Insights into **SQL queries**, **DAX formulas**, and **ETL workflows**.  
