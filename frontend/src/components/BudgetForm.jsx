import React, { useState, useEffect } from 'react';

function BudgetForm({ userId }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch existing budget and spending data when month/year changes
  useEffect(() => {
    if (userId) {
      fetchBudgetData();
    }
  }, [userId, month, year]);

  const fetchBudgetData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(
        `http://localhost:3000/budgets/${userId}/${month}/${year}`
      );
      if (res.ok) {
        const data = await res.json();
        setBudgetData(data);
      } else {
        const err = await res.json();
        setBudgetData(null);
        setMessage(`Info: ${err.message || 'No budget found'}`);
      }
    } catch (e) {
      console.error(e);
      setMessage('Network error: could not fetch budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setMessage('');
    // Basic validation
    if (!userId) {
      setMessage('You must be logged in to set a budget.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid budget amount.');
      return;
    }

    const body = {
      userId,
      month: parseInt(month),
      year: parseInt(year),
      amount: parseFloat(amount),
    };

    try {
      const res = await fetch('http://localhost:3000/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage('Budget set successfully!');
        setAmount('');
        // Refresh budget data
        await fetchBudgetData();
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.message || 'Failed to set budget'}`);
      }
    } catch (e) {
      console.error(e);
      setMessage('Network error: could not reach server');
    }
  };

  return (
    <div>
      <h2>Set Monthly Budget</h2>

      <div>
        <label>
          Month:
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Year:
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
      </div>

      <input
        type="number"
        placeholder="Budget Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleSubmit}>Set Budget</button>

      <pre>{message}</pre>

      {loading && <p>Loading...</p>}

      {budgetData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Budget Summary</h3>
          <p>
            <strong>Budget Amount:</strong> ${budgetData.budget?.amount || 'N/A'}
          </p>
          <p>
            <strong>Total Spent:</strong> ${budgetData.totalSpent || 0}
          </p>
          <p>
            <strong>Remaining:</strong> ${budgetData.remaining || 0}
          </p>
          <p>
            <strong>Usage:</strong> {budgetData.percentage || 0}%
          </p>
          {budgetData.percentage > 90 && (
            <p style={{ color: 'red' }}>⚠ Warning: You've exceeded 90% of your budget!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default BudgetForm;