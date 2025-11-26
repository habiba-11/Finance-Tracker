import React, { useState } from 'react';

function Login({ onLogin }) {
  // State for form inputs and response message
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Handle login
  const handleLogin = async () => {
    // Send login request to backend API
    const response = await fetch('http://localhost:3000/users/login', {
      method: 'POST', // HTTP method
      headers: {
        'Content-Type': 'application/json', // Indicate we're sending JSON
      },
      body: JSON.stringify({ email, password }), // Send email and password as JSON body
    });

    // Check if the response is successful (HTTP 200)
    if (response.ok) {
      // Parse response if login is successful
      const data = await response.json();
      setMessage('Login successful! Redirecting...');
      // Store userId and notify parent
      if (data.userId) {
        try {
          if (onLogin) onLogin(data.userId);
        } catch (err) {
          console.error('onLogin callback error', err);
        }
      }
    } else {
      // Handle errors from the server
      const data = await response.json();
      setMessage(`Error: ${data.message}`); // ✅ FIXED
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)} // Update email state
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)} // Update password state
      />

      <button onClick={handleLogin}>Login</button>

      <pre>{message}</pre> {/* Display success or error message */}
    </div>
  );
}

export default Login;