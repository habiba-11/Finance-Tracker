import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import Layout from '../components/Layout';
import '../styles/global.css';

export default function BudgetView() {
  const [budgetData, setBudgetData] = useState(null);
  const [categorySpending, setCategorySpending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchBudgetData();
  }, [userId, month, year, navigate]);

  const fetchBudgetData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await apiFactory.budgets.getBudget(userId, month, year);
      
      if (data.message === 'No budget set for this month') {
        setBudgetData(null);
        notificationService.info('No budget set for this month/year');
      } else {
        setBudgetData(data);
        
        // Fetch transactions to get category breakdown
        const transactionsData = await apiFactory.transactions.getUserTransactions(userId);
        const monthTransactions = transactionsData.transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() + 1 === month && 
                 tDate.getFullYear() === year && 
                 t.type === 'expense';
        });

        // Calculate category spending
        const categoryMap = {};
        monthTransactions.forEach(t => {
          if (!categoryMap[t.category]) {
            categoryMap[t.category] = 0;
          }
          categoryMap[t.category] += t.amount;
        });

        const categoryArray = Object.entries(categoryMap).map(([name, value]) => ({
          name,
          value: parseFloat(value.toFixed(2))
        }));

        setCategorySpending(categoryArray);
      }
    } catch (error) {
      notificationService.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  if (loading) {
    return (
      <Layout userId={userId}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <Layout userId={userId}>
      <div className="page-header">
        <h1 className="page-title">Budget Overview</h1>
        <p className="page-subtitle">View your budget details and spending breakdown</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label className="form-label">Month</label>
            <select
              className="input"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label className="form-label">Year</label>
            <input
              type="number"
              className="input"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min="2020"
              max={new Date().getFullYear() + 1}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={fetchBudgetData}
            style={{ marginTop: '1.75rem' }}
          >
            Load Budget
          </button>
        </div>
      </div>

      {budgetData && budgetData.budget ? (
        <>
          <div className="grid grid-2">
            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>Budget Summary</h2>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Budget</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  ${budgetData.budget.amount.toFixed(2)}
                </p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Spent</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-color)' }}>
                  ${budgetData.totalSpent.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Remaining</p>
                <p style={{ 
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  color: budgetData.remaining < 0 ? 'var(--danger-color)' : 'var(--secondary-color)'
                }}>
                  ${Math.abs(budgetData.remaining).toFixed(2)}
                  {budgetData.remaining < 0 && ' (Over Budget!)'}
                </p>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>Progress</h2>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.min(budgetData.percentage, 100)}%`,
                    height: '100%',
                    backgroundColor: budgetData.percentage >= 90 ? 'var(--danger-color)' : 
                                   budgetData.percentage >= 70 ? 'var(--warning-color)' : 'var(--secondary-color)',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600
                  }}>
                    {budgetData.percentage >= 10 && `${budgetData.percentage.toFixed(1)}%`}
                  </div>
                </div>
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                {budgetData.percentage.toFixed(1)}% of budget used
              </p>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>Spent vs Remaining</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Spent', value: budgetData.totalSpent },
                      { name: 'Remaining', value: Math.max(0, budgetData.remaining) }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {categorySpending.length > 0 && (
              <div className="card">
                <h2 style={{ marginBottom: '1rem' }}>Category Breakdown</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categorySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="value" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {categorySpending.length > 0 && (
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <h2 style={{ marginBottom: '1rem' }}>Spending by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No budget set for {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}
    </Layout>
  );
}


