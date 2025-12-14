import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import Layout from '../components/Layout';
import '../styles/global.css';

export default function Dashboard() {
  const [budgetData, setBudgetData] = useState(null);
  const [savings, setSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('userId');

  const fetchBudgetData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      console.log('Fetching budget for:', { userId, month, year });
      const data = await apiFactory.budgets.getBudget(userId, month, year);
      
      console.log('Budget data:', data);
      
      if (data.message === 'No budget set for this month') {
        navigate('/set-budget');
        return;
      }

      setBudgetData(data);

      // Fetch transactions to calculate total savings (income)
      try {
        const transactionsData = await apiFactory.transactions.getUserTransactions(userId);
        const totalIncome = transactionsData.summary?.totalIncome || 0;
        console.log('Total income (savings):', totalIncome);
        setSavings(totalIncome);
      } catch (err) {
        console.error('Failed to fetch savings:', err);
      }
    } catch (error) {
      console.error('Budget fetch error:', error);
      if (error.message && error.message.includes('No budget set')) {
        navigate('/set-budget');
      } else {
        notificationService.error('Failed to load budget data');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchBudgetData();
  }, [userId, navigate, fetchBudgetData]);

  // ALWAYS refresh when dashboard is visited
  useEffect(() => {
    if (location.pathname === '/dashboard' && userId) {
      console.log('Dashboard visited - fetching fresh data');
      fetchBudgetData();
    }
  }, [location.pathname, userId, fetchBudgetData]);

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

  if (!budgetData || budgetData.message) {
    return null; // Will redirect to set-budget
  }

  const { budget, totalSpent, remaining, percentage } = budgetData;
  const isOverBudget = remaining < 0;
  const progressColor = percentage >= 90 ? 'var(--danger-color)' : percentage >= 70 ? 'var(--warning-color)' : 'var(--secondary-color)';

  return (
    <Layout userId={userId}>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your budget overview.</p>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>My Savings</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--secondary-color)', marginBottom: '1rem' }}>
            ${savings.toFixed(2)}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Total income saved
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Monthly Budget</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1rem' }}>
            ${budget.amount.toFixed(2)}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Total Spent</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: progressColor, marginBottom: '1rem' }}>
            ${totalSpent.toFixed(2)}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {percentage.toFixed(1)}% of budget used
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Remaining</h2>
          <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: isOverBudget ? 'var(--danger-color)' : 'var(--secondary-color)',
            marginBottom: '1rem' 
          }}>
            ${Math.abs(remaining).toFixed(2)}
            {isOverBudget && ' (Over Budget!)'}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isOverBudget ? 'You have exceeded your budget' : 'Amount left for this month'}
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Budget Progress</h2>
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{
              width: '100%',
              height: '30px',
              backgroundColor: 'var(--border-color)',
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${Math.min(percentage, 100)}%`,
                height: '100%',
                backgroundColor: progressColor,
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                {percentage >= 10 && `${percentage.toFixed(0)}%`}
              </div>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {percentage < 70 && 'You\'re doing great!'}
            {percentage >= 70 && percentage < 90 && 'Keep an eye on your spending'}
            {percentage >= 90 && '⚠ Warning: You\'re approaching your budget limit'}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/budget" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            View Budget Details
          </Link>
          <Link to="/add-transaction" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Add Transaction
          </Link>
          <Link to="/transactions" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            View All Transactions
          </Link>
          <Link to="/previous-budgets" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            Previous Budgets
          </Link>
        </div>
      </div>
    </Layout>
  );
}
