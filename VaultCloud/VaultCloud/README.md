# VaultCloud — Multi-Cloud Cost Estimator

> **"Every rupee in the cloud, accounted."**

VaultCloud is a full-stack web application that helps users estimate and compare cloud service costs across AWS, Azure, and GCP. Add services, track usage, and visualize cost breakdowns instantly.

---

## 🛠 Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | React.js + Tailwind CSS (Vite) |
| Backend  | Node.js + Express.js           |
| Database | SQLite (better-sqlite3)        |
| Charts   | Chart.js (react-chartjs-2)     |

---

## 📂 Folder Structure

```
VaultCloud/
├── backend/
│   ├── src/server.js           # Express server with REST API
│   ├── package.json
│   └── data/                   # Auto-created, stores vaultcloud.db
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # Tailwind directives
│   │   └── components/
│   │       ├── AddServiceForm.jsx
│   │       ├── Dashboard.jsx
│   │       └── ServicesTable.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 🚀 How to Run

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (v9+)

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

The backend server will start on **http://localhost:5000**

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will start on **http://localhost:3000**

### 3. Open the App

Navigate to **http://localhost:3000** in your browser.

---

## 📡 API Routes

| Method | Endpoint            | Description                            |
| ------ | ------------------- | -------------------------------------- |
| GET    | `/api/services`     | Fetch all saved services               |
| POST   | `/api/services`     | Add new service + auto-calculate cost  |
| DELETE | `/api/services/:id` | Delete a service by ID                 |
| GET    | `/api/estimate`     | Get total cost + breakdown by provider |
| GET    | `/api/providers`    | Get hardcoded pricing data             |

### POST `/api/services` — Request Body

```json
{
  "provider": "AWS",
  "service_type": "EC2",
  "usage": 100
}
```

### GET `/api/estimate` — Response

```json
{
  "total_cost": 9.6,
  "by_provider": [{ "provider": "AWS", "total": 9.6 }],
  "by_service_type": [
    { "service_type": "EC2", "provider": "AWS", "total": 9.6 }
  ]
}
```

---

## 💰 Hardcoded Pricing Rates

| Provider | Service   | Rate       | Unit      |
| -------- | --------- | ---------- | --------- |
| AWS      | EC2       | ₹7.97      | /hrs      |
| AWS      | S3        | ₹1.91      | /GB       |
| AWS      | RDS       | ₹9.55      | /hrs      |
| AWS      | Lambda    | ₹0.0000166 | /requests |
| Azure    | VM        | ₹7.39      | /hrs      |
| Azure    | Blob      | ₹1.49      | /GB       |
| Azure    | SQL       | ₹8.72      | /hrs      |
| Azure    | Functions | ₹0.0000133 | /requests |
| GCP      | Compute   | ₹7.06      | /hrs      |
| GCP      | GCS       | ₹1.66      | /GB       |
| GCP      | CloudSQL  | ₹8.30      | /hrs      |
| GCP      | Functions | ₹0.0000083 | /requests |

---

## 🗺 Features

- **Add Cloud Service** — Select provider, service type, enter usage; cost is auto-calculated
- **Dashboard** — View total cost, pie chart by provider, bar chart by service type
- **Services Table** — List all services with cost, usage, and delete option
- **Real-time Updates** — Charts and totals refresh when services are added or deleted
- **Cost Preview** — See estimated cost before adding a service

---

## 📚 Syllabus Mapping

| Module                      | Concept Applied                            |
| --------------------------- | ------------------------------------------ |
| Full-Stack Development      | React frontend + Node.js/Express backend   |
| REST API Design             | GET, POST, DELETE endpoints with Express   |
| Database Management         | SQLite with better-sqlite3, auto-migration |
| Frontend Frameworks         | React components, state management, hooks  |
| CSS Frameworks              | Tailwind CSS utility-first styling         |
| Data Visualization          | Chart.js — Pie and Bar charts              |
| Client-Server Communication | Axios HTTP requests, CORS configuration    |
| Build Tools                 | Vite dev server, HMR                       |

---


