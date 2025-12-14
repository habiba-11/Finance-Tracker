import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import '../styles/global.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (!validate()) {
      notificationService.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const data = await apiFactory.users.login({ email, password });
      
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', email);
        // Try to get stored user name, if not available use email
        if (!localStorage.getItem('userName')) {
          localStorage.setItem('userName', email.split('@')[0]);
        }
        notificationService.success('Login successful! Redirecting...');
        
        // Check if budget is set for current month
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        try {
          await apiFactory.budgets.getBudget(data.userId, month, year);
          navigate('/dashboard');
        } catch (err) {
          // No budget set, redirect to set budget
          navigate('/set-budget');
        }
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      notificationService.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>💰 Finance Tracker</h1>
          <p className="page-subtitle">Login to your account</p>
        </div>

        <form onSubmit={handleLogin}>
          {errors.general && (
            <div className="error-message" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  padding: '0.25rem',
                  color: 'var(--text-secondary)'
                }}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
