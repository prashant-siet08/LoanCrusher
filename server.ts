import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("loans.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    interest_rate REAL NOT NULL,
    tenure_months INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    emi REAL NOT NULL,
    interest_type TEXT DEFAULT 'Reducing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS emi_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    month_number INTEGER NOT NULL,
    status TEXT NOT NULL, -- Paid, Partial, Missed
    amount_paid REAL NOT NULL,
    payment_date TEXT,
    FOREIGN KEY (loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS prepayments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    strategy TEXT DEFAULT 'Reduce Tenure', -- Reduce Tenure or Reduce EMI
    FOREIGN KEY (loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    monthly_salary REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD'
  );
  INSERT OR IGNORE INTO profile (id, monthly_salary) VALUES (1, 0);
`);

const app = express();
app.use(express.json());

// EMI Calculation Utility
function calculateEMI(p: number, annualRate: number, n: number) {
  const r = annualRate / 12 / 100;
  if (r === 0) return p / n;
  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// Amortization Schedule Utility
function generateSchedule(loan: any, payments: any[], prepayments: any[]) {
  const schedule = [];
  let outstanding = loan.amount;
  const monthlyRate = loan.interest_rate / 12 / 100;
  const emi = loan.emi;

  for (let m = 1; m <= loan.tenure_months; m++) {
    if (outstanding <= 0) break;

    const interest = outstanding * monthlyRate;
    let principal = emi - interest;
    
    // Check for prepayments in this month
    const monthPrepayments = prepayments.filter(p => {
        const pDate = new Date(p.date);
        const lDate = new Date(loan.start_date);
        const diffMonths = (pDate.getFullYear() - lDate.getFullYear()) * 12 + (pDate.getMonth() - lDate.getMonth());
        return diffMonths === m - 1;
    });

    const totalPrepayment = monthPrepayments.reduce((sum, p) => sum + p.amount, 0);
    
    if (principal > outstanding) principal = outstanding;
    
    const totalPrincipalPaid = principal + totalPrepayment;
    outstanding = Math.max(0, outstanding - totalPrincipalPaid);

    schedule.push({
      month: m,
      emi: emi,
      interest: interest,
      principal: principal,
      prepayment: totalPrepayment,
      outstanding: outstanding,
      status: payments.find(p => p.month_number === m)?.status || 'Pending'
    });
  }
  return schedule;
}

// API Routes
app.get("/api/profile", (req, res) => {
  const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
  res.json(profile);
});

app.post("/api/profile", (req, res) => {
  const { monthly_salary, currency } = req.body;
  const stmt = db.prepare(`
    UPDATE profile SET monthly_salary = ?, currency = ? WHERE id = 1
  `);
  stmt.run(monthly_salary, currency || 'USD');
  res.json({ success: true });
});

app.post("/api/loans", (req, res) => {
  const { name, amount, interest_rate, tenure_months, start_date } = req.body;
  const emi = calculateEMI(amount, interest_rate, tenure_months);
  
  const stmt = db.prepare(`
    INSERT INTO loans (name, amount, interest_rate, tenure_months, start_date, emi)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(name, amount, interest_rate, tenure_months, start_date, emi);
  res.json({ id: info.lastInsertRowid, emi });
});

app.get("/api/loans", (req, res) => {
  const loans = db.prepare("SELECT * FROM loans ORDER BY created_at DESC").all();
  res.json(loans);
});

app.get("/api/loans/:id", (req, res) => {
  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id);
  if (!loan) return res.status(404).json({ error: "Loan not found" });
  
  const payments = db.prepare("SELECT * FROM emi_payments WHERE loan_id = ?").all(req.params.id);
  const prepayments = db.prepare("SELECT * FROM prepayments WHERE loan_id = ?").all(req.params.id);
  const schedule = generateSchedule(loan, payments, prepayments);
  
  res.json({ ...loan, schedule, payments, prepayments });
});

app.delete("/api/loans/:id", (req, res) => {
  const { id } = req.params;
  const loanId = parseInt(id);
  console.log(`Attempting to delete loan with ID: ${loanId}`);
  
  if (isNaN(loanId)) {
    return res.status(400).json({ error: "Invalid loan ID" });
  }

  try {
    const deleteTransaction = db.transaction((idToDelete) => {
      const emiResult = db.prepare("DELETE FROM emi_payments WHERE loan_id = ?").run(idToDelete);
      const prepayResult = db.prepare("DELETE FROM prepayments WHERE loan_id = ?").run(idToDelete);
      const loanResult = db.prepare("DELETE FROM loans WHERE id = ?").run(idToDelete);
      
      console.log(`Deleted ${emiResult.changes} emi_payments, ${prepayResult.changes} prepayments, and ${loanResult.changes} loans.`);
      
      if (loanResult.changes === 0) {
        throw new Error("Loan not found in database");
      }
    });
    
    deleteTransaction(loanId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(error.message === "Loan not found in database" ? 404 : 500).json({ 
      error: error.message || "Failed to delete loan" 
    });
  }
});

app.post("/api/loans/:id/payments", (req, res) => {
  const { month_number, status, amount_paid, payment_date } = req.body;
  const stmt = db.prepare(`
    INSERT INTO emi_payments (loan_id, month_number, status, amount_paid, payment_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(req.params.id, month_number, status, amount_paid, payment_date);
  res.json({ success: true });
});

app.post("/api/loans/:id/prepayments", (req, res) => {
  const { amount, date, strategy } = req.body;
  const stmt = db.prepare(`
    INSERT INTO prepayments (loan_id, amount, date, strategy)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(req.params.id, amount, date, strategy);
  res.json({ success: true });
});

app.put("/api/loans/:id", (req, res) => {
  const { name, amount, interest_rate, tenure_months, start_date } = req.body;
  const emi = calculateEMI(amount, interest_rate, tenure_months);
  
  const stmt = db.prepare(`
    UPDATE loans 
    SET name = ?, amount = ?, interest_rate = ?, tenure_months = ?, start_date = ?, emi = ?
    WHERE id = ?
  `);
  const info = stmt.run(name, amount, interest_rate, tenure_months, start_date, emi, req.params.id);
  
  if (info.changes === 0) {
    return res.status(404).json({ error: "Loan not found" });
  }
  
  res.json({ success: true, emi });
});

app.post("/api/loans/:id/simulate", (req, res) => {
    const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id);
    const { monthlyExtra, lumpSum, lumpSumMonth } = req.body;
    
    // Simple simulation logic
    let outstanding = loan.amount;
    const monthlyRate = loan.interest_rate / 12 / 100;
    let months = 0;
    let totalInterest = 0;
    
    while (outstanding > 0 && months < 600) { // Safety break at 50 years
        months++;
        const interest = outstanding * monthlyRate;
        totalInterest += interest;
        
        let payment = loan.emi + (monthlyExtra || 0);
        if (lumpSum && months === lumpSumMonth) {
            payment += lumpSum;
        }
        
        const principal = Math.min(outstanding, payment - interest);
        outstanding -= principal;
    }
    
    res.json({
        newTenure: months,
        totalInterest,
        monthsSaved: loan.tenure_months - months,
        interestSaved: (loan.emi * loan.tenure_months - loan.amount) - totalInterest
    });
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
