import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiFactory from '../services/api';
import notificationService from '../services/notification';
import '../styles/global.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!name || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    
    if (!validate()) {
      notificationService.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await apiFactory.users.register({ name, email, password });
      // Store user name in localStorage for later use
      if (response && response.name) {
        localStorage.setItem('userName', response.name);
      } else {
        localStorage.setItem('userName', name);
      }
      notificationService.success('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
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
          <p className="page-subtitle">Create your account</p>
        </div>

        <form onSubmit={handleRegister}>
          {errors.general && (
            <div className="error-message" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
