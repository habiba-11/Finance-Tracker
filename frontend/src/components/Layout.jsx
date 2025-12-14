import { Link, useNavigate } from 'react-router-dom';
import '../styles/global.css';

export default function Layout({ children, userId, userName, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  if (!userId) {
    return <>{children}</>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <Link to="/dashboard" className="navbar-title" style={{ textDecoration: 'none' }}>
              💰 Finance Tracker
            </Link>
            <div className="navbar-actions">
              <Link to="/dashboard" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                Dashboard
              </Link>
              <Link to="/budget" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                Budget
              </Link>
              <Link to="/transactions" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                Transactions
              </Link>
              <Link to="/add-transaction" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                Add Transaction
              </Link>
              <Link to="/previous-budgets" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                Previous Budgets
              </Link>
              <Link to="/profile" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="container">{children}</main>
    </div>
  );
}


