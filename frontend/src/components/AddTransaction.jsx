import React, { useState } from 'react';

function AddTransaction({ userId }) {
	const [amount, setAmount] = useState('');
	const [type, setType] = useState('expense');
	const [category, setCategory] = useState('');
	const [date, setDate] = useState('');
	const [description, setDescription] = useState('');
	const [message, setMessage] = useState('');

	const handleSubmit = async () => {
		setMessage('');
		// Basic validation
		if (!userId) {
			setMessage('You must be logged in to add a transaction.');
			return;
		}

		const body = {
			userId,
			amount: parseFloat(amount),
			type,
			category,
			date,
			description,
		};

		try {
			const res = await fetch('http://localhost:3000/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (res.ok) {
				const data = await res.json();
				setMessage('Transaction added successfully');
				// clear form
				setAmount('');
				setType('expense');
				setCategory('');
				setDate('');
				setDescription('');
			} else {
				const err = await res.json();
				setMessage(`Error: ${err.message || 'Failed to add transaction'}`);
			}
		} catch (e) {
			console.error(e);
			setMessage('Network error: could not reach server');
		}
	};

	return (
		<div>
			<h2>Add Transaction</h2>

			<input
				type="number"
				placeholder="Amount"
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
			/>

			<select value={type} onChange={(e) => setType(e.target.value)}>
				<option value="expense">Expense</option>
				<option value="income">Income</option>
			</select>

			<input
				type="text"
				placeholder="Category"
				value={category}
				onChange={(e) => setCategory(e.target.value)}
			/>

			<input
				type="date"
				value={date}
				onChange={(e) => setDate(e.target.value)}
			/>

			<input
				type="text"
				placeholder="Description (optional)"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
			/>

			<button onClick={handleSubmit}>Add Transaction</button>

			<pre>{message}</pre>
		</div>
	);
}

export default AddTransaction;