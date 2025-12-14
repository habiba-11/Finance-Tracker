import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import Layout from '../components/Layout';
import '../styles/global.css';

export default function SetBudget() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid budget amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validate()) {
      notificationService.error('Please enter a valid budget amount');
      return;
    }

    if (!userId) {
      notificationService.error('You must be logged in to set a budget');
      navigate('/login');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await apiFactory.budgets.create({
        userId,
        month,
        year,
        amount: parseFloat(amount),
      });

      notificationService.success('Budget set successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      const errorMessage = error.message || 'Failed to set budget. Please try again.';
      notificationService.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <Layout userId={userId}>
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card">
          <div className="page-header">
            <h1 className="page-title">Set Your Monthly Budget</h1>
            <p className="page-subtitle">
              Set your budget for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {errors.general && (
            <div className="error-message" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Budget Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input ${errors.amount ? 'input-error' : ''}`}
                placeholder="Enter your monthly budget"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
              {errors.amount && <div className="error-message">{errors.amount}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Setting Budget...' : 'Set Budget'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}


