import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true); // State to toggle between Register and Login

  // Toggle between Register and Login
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="App">
      <h1>Welcome to the Finance Tracker</h1>

      {/* Display either Login or Register based on state */}
      {isLogin ? <Login /> : <Register />}
      
      {/* Button to toggle between Login and Register forms */}
      <button onClick={toggleForm}>
        {isLogin ? 'Need an account? Register here' : 'Already have an account? Login here'}
      </button>
    </div>
  );
}

export default App;