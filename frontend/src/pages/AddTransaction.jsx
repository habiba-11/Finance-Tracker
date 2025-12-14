import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import Layout from '../components/Layout';
import '../styles/global.css';

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Bills',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

export default function AddTransaction() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  // Form state
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if not logged in
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  // Reset category when type changes
  useEffect(() => {
    if (type === 'income') {
      setCategory('My Savings');
    } else {
      setCategory('');
    }
  }, [type]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Amount validation
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    // Category validation (only for expense)
    if (type === 'expense' && !category) {
      newErrors.category = 'Please select a category';
    }

    // Date validation
    if (!date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      notificationService.error('Please fix the errors in the form');
      return;
    }

    if (!userId) {
      notificationService.error('You must be logged in');
      navigate('/login');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Format date as YYYY-MM-DD string (backend will handle conversion)
      const dateString = date;
      
      // Prepare transaction data
      const transactionData = {
        userId,
        amount: parseFloat(amount),
        type,
        category: type === 'income' ? 'My Savings' : category,
        date: dateString,
        description: type === 'expense' ? (description.trim() || undefined) : undefined,
      };

      console.log('=== ADDING TRANSACTION ===');
      console.log('Data:', transactionData);

      // Create transaction
      const result = await apiFactory.transactions.create(transactionData);
      
      console.log('=== TRANSACTION CREATED ===');
      console.log('Result:', result);

      // Show success message
      notificationService.success('Transaction added successfully!');

      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      if (type === 'expense') {
        setCategory('');
      }

      // Wait a moment then redirect - this ensures database is updated
      setTimeout(() => {
        if (type === 'income') {
          navigate('/dashboard');
        } else {
          navigate('/transactions');
        }
      }, 1000);

    } catch (error) {
      console.error('=== TRANSACTION ERROR ===');
      console.error('Error:', error);
      
      let errorMessage = 'Failed to add transaction. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      notificationService.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <Layout userId={userId}>
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
        <div className="page-header">
          <h1 className="page-title">Add Transaction</h1>
          <p className="page-subtitle">Record a new income or expense</p>
        </div>

        <div className="card">
          {errors.general && (
            <div className="error-message" style={{ 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '8px',
              color: 'var(--danger-color)'
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Transaction Type */}
            <div className="form-group">
              <label className="form-label">Transaction Type *</label>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={loading}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={`input ${errors.amount ? 'input-error' : ''}`}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
              {errors.amount && (
                <div className="error-message">{errors.amount}</div>
              )}
            </div>

            {/* Category - Different for income vs expense */}
            {type === 'income' ? (
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="input"
                  value="My Savings"
                  disabled
                  style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Income is automatically saved to "My Savings"
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className={`input ${errors.category ? 'input-error' : ''}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <div className="error-message">{errors.category}</div>
                )}
              </div>
            )}

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className={`input ${errors.date ? 'input-error' : ''}`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && (
                <div className="error-message">{errors.date}</div>
              )}
            </div>

            {/* Description - Only for expense */}
            {type === 'expense' && (
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="Add a description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Adding Transaction...' : 'Add Transaction'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
