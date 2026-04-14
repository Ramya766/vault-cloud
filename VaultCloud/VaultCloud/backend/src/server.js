require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

// ─── CORS Configuration ─────────────────────────────────────────────────────
// Build the allowed origins list dynamically
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

// Add the Azure Static Web App URL if configured
if (process.env.AZURE_STATIC_WEB_APP_URL) {
  allowedOrigins.push(process.env.AZURE_STATIC_WEB_APP_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// INR Pricing rates
const PRICING = {
  AWS: {
    EC2: { rate: 7.97, unit: "hrs", label: "EC2 Instance" },
    S3: { rate: 1.91, unit: "GB", label: "S3 Storage" },
    RDS: { rate: 9.55, unit: "hrs", label: "RDS Database" },
    Lambda: { rate: 0.0000166, unit: "requests", label: "Lambda Functions" },
  },
  Azure: {
    VM: { rate: 7.39, unit: "hrs", label: "Virtual Machine" },
    Blob: { rate: 1.49, unit: "GB", label: "Blob Storage" },
    SQL: { rate: 8.72, unit: "hrs", label: "Azure SQL" },
    Functions: { rate: 0.0000133, unit: "requests", label: "Azure Functions" },
  },
  GCP: {
    Compute: { rate: 7.06, unit: "hrs", label: "Compute Engine" },
    GCS: { rate: 1.66, unit: "GB", label: "Cloud Storage" },
    CloudSQL: { rate: 8.3, unit: "hrs", label: "Cloud SQL" },
    Functions: { rate: 0.0000083, unit: "requests", label: "Cloud Functions" },
  },
};

let pool;

// ─── Database Initialization ─────────────────────────────────────────────────
// Supports BOTH formats:
//   1. Individual env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
//   2. Legacy DATABASE_URL: mysql://user:pass@host:port/dbname
async function initDb() {
  let connectionConfig;

  if (process.env.DB_HOST) {
    // ── Azure / Docker Compose style (individual env vars) ──
    connectionConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

    // Azure MySQL Flexible Server requires SSL in production
    if (process.env.NODE_ENV === "production" && process.env.DB_SSL !== "false") {
      connectionConfig.ssl = { rejectUnauthorized: true };
    }
  } else if (process.env.DATABASE_URL) {
    // ── Legacy DATABASE_URL format ──
    const url = new URL(process.env.DATABASE_URL);
    connectionConfig = {
      host: url.hostname,
      port: url.port || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace("/", ""),
    };
  } else {
    console.error("❌ No database configuration found. Set DB_HOST or DATABASE_URL.");
    process.exit(1);
  }

  pool = mysql.createPool({
    ...connectionConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    // Verify connection
    const connection = await pool.getConnection();
    console.log("📂 Connected to MySQL database");
    connection.release();

    // Create tables
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider VARCHAR(50),
        service_type VARCHAR(50),
        \`usage\` DOUBLE,
        unit VARCHAR(50),
        cost DOUBLE,
        month VARCHAR(20),
        year INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider VARCHAR(50),
        monthly_limit DOUBLE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_user_provider (user_id, provider)
      )
    `);

    console.log("✅ Database tables initialized");
  } catch (err) {
    console.error("Error initializing database:", err.message);
    process.exit(1);
  }
}

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/health", async (req, res) => {
  try {
    // Verify DB is reachable
    await pool.execute("SELECT 1");
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    );

    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ token, user: { id: result.insertId, name, email } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    const user = rows[0];
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/profile
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── SERVICE ROUTES (PROTECTED) ──────────────────────────────────────────────

// GET /api/services
app.get("/api/services", authenticateToken, async (req, res) => {
  try {
    const [services] = await pool.execute(
      "SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/services
app.post("/api/services", authenticateToken, async (req, res) => {
  try {
    const { provider, service_type, usage } = req.body;

    if (!provider || !service_type || usage === undefined || usage === null) {
      return res.status(400).json({
        error: "Missing required fields: provider, service_type, usage",
      });
    }

    const providerPricing = PRICING[provider];
    if (!providerPricing) {
      return res.status(400).json({ error: `Invalid provider: ${provider}` });
    }

    const servicePricing = providerPricing[service_type];
    if (!servicePricing) {
      return res.status(400).json({
        error: `Invalid service type: ${service_type} for provider ${provider}`,
      });
    }

    const cost = parseFloat((usage * servicePricing.rate).toFixed(6));
    const unit = servicePricing.unit;
    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();

    const [result] = await pool.execute(
      "INSERT INTO services (user_id, provider, service_type, `usage`, unit, cost, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, provider, service_type, usage, unit, cost, month, year],
    );

    const [rows] = await pool.execute("SELECT * FROM services WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/services/:id
app.delete("/api/services/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      "SELECT * FROM services WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Service not found or not owned by user" });
    }

    await pool.execute("DELETE FROM services WHERE id = ?", [id]);
    res.json({ message: "Service deleted successfully", id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/estimate
app.get("/api/estimate", authenticateToken, async (req, res) => {
  try {
    // Total cost
    const [totalRows] = await pool.execute(
      "SELECT COALESCE(SUM(cost), 0) as total FROM services WHERE user_id = ?",
      [req.user.id],
    );

    // By provider
    const [byProvider] = await pool.execute(
      "SELECT provider, COALESCE(SUM(cost), 0) as total FROM services WHERE user_id = ? GROUP BY provider",
      [req.user.id],
    );

    // By service type
    const [byServiceType] = await pool.execute(
      "SELECT service_type, provider, COALESCE(SUM(cost), 0) as total FROM services WHERE user_id = ? GROUP BY service_type, provider",
      [req.user.id],
    );

    res.json({
      total_cost: totalRows[0].total,
      by_provider: byProvider,
      by_service_type: byServiceType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── BUDGET ROUTES (PROTECTED) ──────────────────────────────────────────────

// POST /api/budget
app.post("/api/budget", authenticateToken, async (req, res) => {
  try {
    const { provider, monthly_limit } = req.body;

    if (!provider || monthly_limit === undefined) {
      return res
        .status(400)
        .json({ error: "Provider and monthly_limit are required" });
    }

    // MySQL equivalent of INSERT OR REPLACE — uses ON DUPLICATE KEY UPDATE
    await pool.execute(
      `INSERT INTO budgets (user_id, provider, monthly_limit)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit)`,
      [req.user.id, provider, monthly_limit],
    );

    res.json({ message: "Budget set successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/budget
app.get("/api/budget", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();

    // Get budgets
    const [budgets] = await pool.execute(
      "SELECT provider, monthly_limit FROM budgets WHERE user_id = ?",
      [req.user.id],
    );

    // Get current month spend
    const [spends] = await pool.execute(
      "SELECT provider, COALESCE(SUM(cost), 0) as spent FROM services WHERE user_id = ? AND month = ? AND year = ? GROUP BY provider",
      [req.user.id, month, year],
    );

    const result = {};
    budgets.forEach((budget) => {
      const spend = spends.find((s) => s.provider === budget.provider);
      const spent = spend ? spend.spent : 0;
      const percentage =
        budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;
      result[budget.provider] = {
        limit: budget.monthly_limit,
        spent: spent,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── HISTORY ROUTE (PROTECTED) ──────────────────────────────────────────────

// GET /api/history
app.get("/api/history", authenticateToken, async (req, res) => {
  try {
    const [history] = await pool.execute(
      "SELECT month, year, COALESCE(SUM(cost), 0) as total FROM services WHERE user_id = ? GROUP BY month, year ORDER BY year DESC, month DESC",
      [req.user.id],
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// GET /api/providers
app.get("/api/providers", (req, res) => {
  res.json(PRICING);
});

// Start server
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`✅ VaultCloud Backend running on http://localhost:${PORT}`);
    console.log(`🐬 Connected to MySQL database`);
  });
}

startServer();
