live url :- https://budget-seven-dusky.vercel.app/

# budget
This is my first github file.

BudgetMaster – Personal Finance & Analytics App

📌 Overview

BudgetMaster is a feature-rich, single-page personal finance application built using HTML, CSS, and JavaScript.
It allows users to track income and expenses, analyze spending patterns, manage budgets, and visualize financial data through interactive charts.

The project emphasizes data modeling, client-side state management, and analytical visualizations, making it a strong foundation for future migration to a full MERN stack backend.

🎯 Key Objectives

Track income and expense transactions efficiently

Analyze financial data using aggregations and visualizations

Provide insights through dashboards, charts, and reports

Practice real-world data handling and analytics logic

Build a scalable frontend architecture ready for backend integration

🚀 Features
💰 Transactions Management

Add income and expense records

Categorize transactions dynamically

Search and filter transaction history

Undo last transaction

📊 Analytics Dashboard

Net balance calculation

Total income vs total expense

Time-series cash flow analysis

Category-wise expense distribution

🗓 Calendar View

Monthly calendar with transaction indicators

Visual distinction between income and expenses per day

🎯 Budget Limits

Set category-wise spending limits

Real-time progress tracking with alerts

Visual budget utilization indicators

🫙 Dream Jar (Savings Goal)

Set a savings goal

Deposit and withdraw amounts

Automatic syncing with transaction history

Progress animations and goal celebration

📁 Reports & Data Management

Export transactions as PDF or CSV

Full data backup to JSON

Restore application state from backup

🔒 Privacy & UX

Privacy mode to blur sensitive financial data

Light/Dark mode toggle

Responsive and modern UI design

🧠 Technical Architecture

This project is a client-side Single Page Application (SPA).

UI (HTML + CSS)
        ↓
State Management (JavaScript)
        ↓
Data Processing & Aggregation
        ↓
Persistence (localStorage)
        ↓
Charts & Reports


There is no backend server in the current version.
All data is stored locally using the browser’s localStorage.

🧩 Data Model

Each transaction follows a structured schema:

{
  id: Number,
  type: "income" | "expense",
  amount: Number,
  desc: String,
  cat: String,
  date: "YYYY-MM-DD",
  time: "HH:MM",
  recurring: Boolean
}


This schema is directly compatible with MongoDB, making backend migration straightforward.

🛠 Tech Stack
Frontend

HTML5
--->
CSS3 (Glassmorphism, Dark/Light Theme)
--->
JavaScript (ES6+)
--->
Libraries
--->
Chart.js (Data visualization)
--->
jsPDF + AutoTable (PDF reports)
--->
Canvas Confetti (UI feedback)
--->
Phosphor Icons

Storage



📈 Data Science Concepts Used

Time-series aggregation

Cumulative sums (running balance)

Category-based grouping

Percentage and threshold analysis

Data transformation for visualization

⚠ Limitations (Current Version)

No authentication or multi-user support

Data stored locally (not secure or scalable)

Performance depends on browser memory

Monolithic file structure

These are intentional trade-offs for a frontend-first prototype.

🔮 Planned Enhancements

Migrate persistence to MongoDB

Build REST APIs using Node.js & Express

Add JWT-based authentication

Introduce advanced analytics (monthly trends, predictions)

Modularize frontend code

Deploy full MERN stack version

👨‍💻 Author

Kumar Vikram Aditya
Computer Science Undergraduate
Focus: Data Science | MERN Backend | DSA in C++

📌 Disclaimer

This project is built for learning, experimentation, and skill development.
It demonstrates strong fundamentals in data handling and frontend analytics and serves as a foundation for future backend and data science extensions

Browser localStorage
with BackUp features
