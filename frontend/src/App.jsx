import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import AddTransaction from './components/AddTransaction';
import BudgetForm from './components/BudgetForm';
import './App.css';

function App() {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'app'
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');

  const handleLogin = (id) => {
    localStorage.setItem('userId', id);
    setUserId(id);
    setView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUserId('');
    setView('login');
  };

  const handleRegistered = () => {
    setView('login');
  };

  if (view === 'app' && userId) {
    return (
      <div className="App">
        <h1>Finance Tracker</h1>
        <button onClick={handleLogout}>Logout</button>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <AddTransaction userId={userId} />
          </div>
          <div style={{ flex: 1 }}>
            <BudgetForm userId={userId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Welcome to the Finance Tracker</h1>

      {view === 'login' && (
        <>
          <Login onLogin={handleLogin} />
          <button onClick={() => setView('register')}>Need an account? Register here</button>
        </>
      )}

      {view === 'register' && (
        <>
          <Register onRegistered={handleRegistered} />
          <button onClick={() => setView('login')}>Already have an account? Login here</button>
        </>
      )}
    </div>
  );
}

export default App;