import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import Layout from '../components/Layout';
import { formatDateDDMMYYYY } from '../utils/dateUtils';
import '../styles/global.css';

const CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Bills',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
  'All'
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('userId');

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      console.warn('No userId found, cannot fetch transactions');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 FETCHING TRANSACTIONS');
      console.log('User ID:', userId);
      
      const data = await apiFactory.transactions.getUserTransactions(userId);
      
      console.log('✅ DATA RECEIVED FROM API:', data);
      console.log('Transactions array:', data?.transactions);
      console.log('Transaction count:', data?.transactions?.length || 0);
      
      const transactionsArray = Array.isArray(data?.transactions) ? data.transactions : [];
      
      console.log('Setting', transactionsArray.length, 'transactions');
      
      // Sort by date (newest first)
      const sorted = [...transactionsArray].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      setTransactions(sorted);
      setFilteredTransactions(sorted);
      
      console.log('✅ STATE UPDATED - Transactions:', sorted.length);
    } catch (error) {
      console.error('❌ ERROR:', error);
      notificationService.error(`Failed to load transactions: ${error.message}`);
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch on mount
  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchTransactions();
  }, [userId, navigate, fetchTransactions]);

  // Refresh when page is visited
  useEffect(() => {
    if (location.pathname === '/transactions' && userId) {
      fetchTransactions();
    }
  }, [location.pathname, userId, fetchTransactions]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredTransactions(filtered);
  }, [dateFilter, categoryFilter, transactions]);

  const clearFilters = () => {
    setDateFilter('');
    setCategoryFilter('All');
  };

  const getUniqueCategories = () => {
    const categories = new Set(transactions.map(t => t.category));
    return Array.from(categories);
  };

  if (!userId) return null;

  if (loading) {
    return (
      <Layout userId={userId}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading transactions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userId={userId}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Your Transactions</h1>
            <p className="page-subtitle">View and filter all your transactions</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={fetchTransactions}
            style={{ marginTop: '0' }}
          >
            🔄 Refresh
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Total: {transactions.length} transaction(s) | Showing: {filteredTransactions.length}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Filters</h2>
        <div className="grid grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Filter by Date</label>
            <input
              type="date"
              className="input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Filter by Category</label>
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {getUniqueCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        {(dateFilter || categoryFilter !== 'All') && (
          <button
            className="btn btn-outline"
            onClick={clearFilters}
            style={{ marginTop: '1rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions found. Start by adding a transaction!
          </p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions match your filters.
          </p>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>
              Transactions ({filteredTransactions.length})
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction._id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem' }}>
                      {formatDateDDMMYYYY(transaction.date)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: transaction.type === 'income' 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(239, 68, 68, 0.1)',
                        color: transaction.type === 'income' 
                          ? 'var(--secondary-color)' 
                          : 'var(--danger-color)'
                      }}>
                        {transaction.type === 'income' ? '💰 Income' : '💸 Expense'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{transaction.category}</td>
                    <td style={{ 
                      padding: '1rem',
                      fontWeight: 600,
                      color: transaction.type === 'income' 
                        ? 'var(--secondary-color)' 
                        : 'var(--danger-color)'
                    }}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {transaction.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
