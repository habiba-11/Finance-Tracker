import React, { useState, useEffect } from 'react';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

const GetTransaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Get userId from localStorage
    if (userId) {
      fetchTransactions(userId); // Pass userId to fetch function
    } else {
      setMessage('You must be logged in to view transactions.');
    }
  }, []);

  // Fetch transactions from the backend using userId in the URL path
  const fetchTransactions = async (userId) => {
    setMessage('');
    try {
      // Update the URL to pass userId as part of the URL path
      const res = await fetch(`http://localhost:3000/transactions/${userId}`);
      
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);  // Assuming backend returns { transactions, summary }
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.message || 'Failed to fetch transactions'}`);
      }
    } catch (e) {
      console.error(e);
      setMessage('Network error: could not reach server');
    }
  };

  return (
    <div>
      <h2>Your Transactions</h2>

      {/* Show any messages, like errors */}
      {message && <p>{message}</p>}

      {/* Check if there are any transactions to display */}
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction._id}>
              <p><strong>Amount:</strong> {transaction.amount}</p>
              <p><strong>Type:</strong> {transaction.type}</p>
              <p><strong>Category:</strong> {transaction.category}</p>
              <p><strong>Date:</strong> {formatDateDDMMYYYY(transaction.date)}</p>
              <p><strong>Description:</strong> {transaction.description || 'N/A'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GetTransaction;
