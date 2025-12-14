import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SetBudget from './pages/SetBudget';
import BudgetView from './pages/BudgetView';
import AddTransaction from './pages/AddTransaction';
import Transactions from './pages/Transactions';
import PreviousBudgets from './pages/PreviousBudgets';
import Profile from './pages/Profile';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const userId = localStorage.getItem('userId');
  return userId ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/set-budget"
          element={
            <ProtectedRoute>
              <SetBudget />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <BudgetView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-transaction"
          element={
            <ProtectedRoute>
              <AddTransaction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/previous-budgets"
          element={
            <ProtectedRoute>
              <PreviousBudgets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;