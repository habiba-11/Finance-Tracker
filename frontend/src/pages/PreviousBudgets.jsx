import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import Layout from '../components/Layout';
import '../styles/global.css';

export default function PreviousBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchAllBudgets();
  }, [userId, navigate]);

  const fetchAllBudgets = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await apiFactory.budgets.getAllBudgets(userId);
      setBudgets(data.budgets || []);
    } catch (error) {
      notificationService.error('Failed to load previous budgets');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month) => {
    return new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
  };

  const getBudgetStatus = (budgetItem) => {
    if (budgetItem.remaining < 0) {
      return { text: 'Over Budget', color: 'var(--danger-color)', bgColor: 'rgba(239, 68, 68, 0.1)' };
    } else if (budgetItem.percentage >= 90) {
      return { text: 'Warning', color: 'var(--warning-color)', bgColor: 'rgba(245, 158, 11, 0.1)' };
    } else if (budgetItem.percentage >= 70) {
      return { text: 'Caution', color: 'var(--warning-color)', bgColor: 'rgba(245, 158, 11, 0.1)' };
    } else {
      return { text: 'On Track', color: 'var(--secondary-color)', bgColor: 'rgba(16, 185, 129, 0.1)' };
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

  return (
    <Layout userId={userId}>
      <div className="page-header">
        <h1 className="page-title">Previous Budgets</h1>
        <p className="page-subtitle">View all your past budget details and performance</p>
      </div>

      {budgets.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No previous budgets found. Start by setting a budget!
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {budgets.map((budgetItem) => {
            const status = getBudgetStatus(budgetItem);
            const { budget, totalSpent, remaining, percentage } = budgetItem;
            const isOverBudget = remaining < 0;

            return (
              <div key={budget._id} className="card">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                    {getMonthName(budget.month)} {budget.year}
                  </h2>
                  <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: status.bgColor,
                    color: status.color
                  }}>
                    {status.text}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Budget:</span>
                    <span style={{ fontWeight: 600 }}>${budget.amount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Spent:</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger-color)' }}>
                      ${totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Remaining:</span>
                    <span style={{ 
                      fontWeight: 600,
                      color: isOverBudget ? 'var(--danger-color)' : 'var(--secondary-color)'
                    }}>
                      ${Math.abs(remaining).toFixed(2)}
                      {isOverBudget && ' (Over)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Usage:</span>
                    <span style={{ fontWeight: 600 }}>{percentage.toFixed(1)}%</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${Math.min(percentage, 100)}%`,
                      height: '100%',
                      backgroundColor: percentage >= 90 ? 'var(--danger-color)' : 
                                     percentage >= 70 ? 'var(--warning-color)' : 'var(--secondary-color)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {isOverBudget && (
                  <p style={{ 
                    marginTop: '1rem', 
                    color: 'var(--danger-color)', 
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}>
                    ⚠ You exceeded your budget by ${Math.abs(remaining).toFixed(2)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}


