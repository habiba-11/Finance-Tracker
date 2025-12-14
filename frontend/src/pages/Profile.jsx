import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/global.css';

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName') || 'User';

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  if (!userId) return null;

  return (
    <Layout userId={userId} userName={userName} onLogout={handleLogout}>
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>

        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '2.5rem',
              color: 'white',
              fontWeight: 700
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{userName}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{userEmail}</p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '1rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>User ID:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{userId}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '1rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '8px'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
              <span>{userEmail}</span>
            </div>
          </div>

          <div style={{ 
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <p style={{ 
              color: 'var(--danger-color)', 
              fontSize: '0.875rem',
              margin: 0,
              textAlign: 'center'
            }}>
              ⚠ Note: This is a demo application. Account settings and password changes are not implemented.
            </p>
          </div>

          <button
            className="btn btn-danger"
            style={{ width: '100%' }}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </Layout>
  );
}


