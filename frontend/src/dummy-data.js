export const accounts = [
  { id: 1, name: 'HDFC Savings', type: 'Bank', balance: 38500, icon: '🏦', color: '#4C9AFF' },
  { id: 2, name: 'Cash Wallet', type: 'Cash', balance: 3200, icon: '💵', color: '#10E8A0' },
  { id: 3, name: 'ICICI Credit', type: 'Credit', balance: -8900, icon: '💳', color: '#A78BFA' }
];

export const goals = [
  { id: 1, name: 'New Laptop', target: 50000, saved: 39000, icon: '💻', color: '#4C9AFF', daysLeft: 42 },
  { id: 2, name: 'Goa Trip', target: 30000, saved: 10500, icon: '✈️', color: '#10E8A0', daysLeft: 65 },
  { id: 3, name: 'Emergency Fund', target: 100000, saved: 72000, icon: '🏛️', color: '#FFB020', daysLeft: null },
  { id: 4, name: 'New Phone', target: 80000, saved: 12000, icon: '📱', color: '#A78BFA', daysLeft: 120 }
];

export const budgets = [
  { name: 'Food', icon: '🍔', spent: 4100, limit: 5000 },
  { name: 'Transport', icon: '🚗', spent: 900, limit: 2000 },
  { name: 'Entertainment', icon: '🎮', spent: 950, limit: 1000 }
];

export const transactions = [
  { name: 'Swiggy Order', category: 'Food', amount: -320, time: '2h ago', icon: '🍔' },
  { name: 'Salary Credit', category: 'Income', amount: 82000, time: 'Today', icon: '💰' },
  { name: 'Uber Ride', category: 'Transport', amount: -180, time: '3h ago', icon: '🚗' },
  { name: 'Netflix', category: 'Entertainment', amount: -649, time: 'Yesterday', icon: '🎬' },
  { name: 'Electricity Bill', category: 'Utilities', amount: -1200, time: '2d ago', icon: '⚡' }
];

export const debtsOweMe = [
  { person: 'Rahul', amount: 1500, due: 'Jun 15', note: 'Split dinner at Smoke House', overdue: false },
  { person: 'Priya', amount: 3200, due: 'May 1', note: 'Flight tickets to Goa', overdue: true }
];

export const debtsIOwe = [
  { person: 'Arjun', amount: 800, due: 'Jun 20', note: 'Movie + dinner last week', overdue: false }
];
