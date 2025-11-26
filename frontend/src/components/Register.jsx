import React, { useState } from 'react';

function Register({ onRegistered }) {
  // State for form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Handle form submission
  const handleRegister = async () => {
  console.log('Form submitted');
  
  // Log the data being sent
  console.log({ name, email, password });

  const response = await fetch('http://localhost:3000/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  console.log(response);

  if (response.ok) {
    setMessage('Registration successful! You can now login.');
    if (onRegistered) onRegistered();
  } else {
    const data = await response.json();
    console.log('Error response:', data);
    setMessage(`Error: ${data.message}`);
  }
};


  return (
    <div>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Register</button>
      <pre>{message}</pre> {/* Displaying the message */}
    </div>
  );
}

export default Register;