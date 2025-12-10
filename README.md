# Rideau Canal Dashboard
## Overview
This repository contains the **web dashboard** for the CST8916 Rideau Canal Real-Time Monitoring System.

The dashboard displays:
- **Live 5‑minute aggregated safety data** for:
  - Dow’s Lake
  - Fifth Avenue
  - NAC  
- **Safety status badges** (Safe, Caution, Unsafe)
- **Auto‑refresh every 30 seconds**
- **Historical trend charts** generated from Azure Blob Storage data

The dashboard is powered by a Node.js backend and deployed to **Azure App Service**.

---

## Technologies Used
- **Node.js / Express**
- **@azure/cosmos** (Cosmos DB SDK)
- **Azure Storage Blob SDK**
- **Chart.js** for frontend visualizations
- **HTML, CSS, JavaScript**
- **dotenv** for local configuration

---

## Prerequisites
Before running the dashboard, ensure you have:

### ✔ Node.js Installed
Check with:
```bash
node --version
```

### ✔ Cosmos DB Instance Created
Database: `RideauCanalDB`  
Container: `SensorAggregations`

### ✔ Valid Data Flow
You must have:
- Sensor simulation running  
- Stream Analytics job writing to Cosmos DB + Blob Storage  

---

## Installation

Clone the dashboard repository and install dependencies:

```bash
npm install
```

---

## Configuration

### 1. Create `.env` File
Copy the example file:

```bash
cp .env.example .env
```

### 2. Add Required Variables
Your `.env` should contain:

```
COSMOS_ENDPOINT="https://<your-account>.documents.azure.com:443/"
COSMOS_KEY="<your-primary-key>"
COSMOS_DB_NAME="RideauCanalDB"
COSMOS_CONTAINER_NAME="SensorAggregations"

AZURE_STORAGE_CONNECTION_STRING="<your-storage-connection>"
AZURE_STORAGE_CONTAINER="historical-data"
```

Do **NOT** commit real secrets to GitHub.

---

## API Endpoints

### **GET /api/latest**
Returns the **latest values** from Cosmos DB for all three locations.

Example response:
```json
{
  "dowsLake": { "iceThickness": 32, "surfaceTemperature": -4, "status": "Safe" },
  "fifthAvenue": { "iceThickness": 28, "surfaceTemperature": -1, "status": "Caution" },
  "nac": { "iceThickness": 22, "surfaceTemperature": 2, "status": "Unsafe" }
}
```

---

### **GET /api/history**
Reads historical JSON files from Blob Storage and returns time‑series data for the trend charts.

Example response:
```json
{
  "timestamps": ["08:00", "08:05", "08:10"],
  "thickness": [30, 31, 32],
  "surfaceTemp": [-5, -4.2, -3.9]
}
```

---

## Running Locally

To start the server locally:

```bash
npm start
```

Dashboard opens at:

```
http://localhost:3000
```

---

## Deployment (Azure App Service)

Follow these steps to deploy:

### **1. Create a Web App**
- Runtime: **Node 18 LTS**
- OS: Linux
- SKU: Free (F1)

### **2. Configure Application Settings**
Add environment variables under:
**App Service → Configuration → Application Settings**

Include:
```
COSMOS_ENDPOINT
COSMOS_KEY
COSMOS_DB_NAME
COSMOS_CONTAINER_NAME
AZURE_STORAGE_CONNECTION_STRING
AZURE_STORAGE_CONTAINER
```

### **3. ZIP Deploy**
Create a ZIP of all project files:

```
server.js
package.json
public/
.env (not required — use App Service settings)
```

Upload via:

**Deployment Center → Manual Deployment (Publish files)**

### **4. Restart App Service**
Go to **Overview → Restart**

### **5. Test Live URL**
Example:

```
https://rideau-canal-dashboard.azurewebsites.net
```

---

## AI Tools Disclosure

AI tools were used only to:
- Suggest documentation structure  
- Assist in debugging API logic  
- Provide formatting and best‑practice tips  
- Improve UI layout reasoning  

---

## Author
**Ken Biju Jacob**  
CST8916 – Remote Data & Real-Time Applications  

---
