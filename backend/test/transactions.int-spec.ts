import { INestApplication } from '@nestjs/common';
import { createTestApp, stopMongoMemoryServer, getRequestAgent, clearDatabase } from './test-setup';
import * as request from 'supertest';

describe('Transactions Integration Tests (e2e)', () => {
  let app: INestApplication;
  let httpAgent: request.SuperTest<request.Test>;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    httpAgent = getRequestAgent(app);

    // Register a user for transaction tests
    const userData = {
      name: 'Transaction Test User',
      email: 'transactiontest@example.com',
      password: 'password123',
    };

    const registerResponse = await httpAgent
      .post('/users/register')
      .send(userData)
      .expect(201);

    userId = registerResponse.body._id;
    expect(userId).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  beforeEach(async () => {
    // Clear transactions before each test to ensure isolation
    await clearDatabase(app);
    
    // Re-register user after clearing database
    const userData = {
      name: 'Transaction Test User',
      email: `transactiontest-${Date.now()}@example.com`, // Unique email
      password: 'password123',
    };
    const registerResponse = await httpAgent
      .post('/users/register')
      .send(userData)
      .expect(201);
    userId = registerResponse.body._id;
  });

  describe('POST /transactions', () => {
    it('should create an income transaction successfully', async () => {
      const transactionData = {
        userId,
        amount: 1000,
        type: 'income',
        category: 'Salary',
        date: '2024-12-15',
        description: 'Monthly salary',
      };

      const response = await httpAgent
        .post('/transactions')
        .send(transactionData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('amount', transactionData.amount);
      expect(response.body).toHaveProperty('type', transactionData.type);
      expect(response.body).toHaveProperty('category', transactionData.category);
      expect(response.body.userId.toString()).toBe(userId);
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('description', transactionData.description);
    });

    it('should create an expense transaction successfully', async () => {
      const transactionData = {
        userId,
        amount: 50,
        type: 'expense',
        category: 'Food',
        date: '2024-12-15',
        description: 'Lunch',
      };

      const response = await httpAgent
        .post('/transactions')
        .send(transactionData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('amount', transactionData.amount);
      expect(response.body).toHaveProperty('type', transactionData.type);
      expect(response.body).toHaveProperty('category', transactionData.category);
      expect(response.body.userId.toString()).toBe(userId);
    });

    it('should fail to create transaction with invalid userId', async () => {
      const transactionData = {
        userId: 'invalid-id',
        amount: 100,
        type: 'expense',
        category: 'Food',
        date: '2024-12-15',
      };

      const response = await httpAgent
        .post('/transactions')
        .send(transactionData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail to create transaction with missing required fields', async () => {
      const transactionData = {
        userId,
        // Missing amount, type, date
      };

      const response = await httpAgent
        .post('/transactions')
        .send(transactionData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail to create expense without category', async () => {
      const transactionData = {
        userId,
        amount: 100,
        type: 'expense',
        date: '2024-12-15',
        // Missing category
      };

      const response = await httpAgent
        .post('/transactions')
        .send(transactionData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Category is required');
    });
  });

  describe('GET /transactions/:userId', () => {
    beforeEach(async () => {
      // Clear database and re-register user for each test in this block
      await clearDatabase(app);
      const userData = {
        name: 'Transaction Get User',
        email: `transactionget-${Date.now()}@example.com`,
        password: 'password123',
      };
      const registerResponse = await httpAgent
        .post('/users/register')
        .send(userData)
        .expect(201);
      userId = registerResponse.body._id;

      // Create multiple transactions for testing
      const transactions = [
        {
          userId,
          amount: 2000,
          type: 'income',
          category: 'Salary',
          date: '2024-12-15',
        },
        {
          userId,
          amount: 100,
          type: 'expense',
          category: 'Food',
          date: '2024-12-15',
        },
        {
          userId,
          amount: 50,
          type: 'expense',
          category: 'Transport',
          date: '2024-12-15',
        },
      ];

      for (const transaction of transactions) {
        await httpAgent.post('/transactions').send(transaction).expect(201);
      }
    });

    it('should get all transactions for a user with correct summary', async () => {
      const response = await httpAgent
        .get(`/transactions/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('summary');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.summary).toHaveProperty('totalIncome');
      expect(response.body.summary).toHaveProperty('totalExpense');
      expect(response.body.summary).toHaveProperty('balance');

      // Verify we have exactly 3 transactions from beforeEach
      expect(response.body.transactions.length).toBe(3);

      // Verify summary calculations
      const { totalIncome, totalExpense, balance } = response.body.summary;
      
      // Expected totals from beforeEach transactions:
      // 2000 (income) + 100 (expense) + 50 (expense) = 2000 income, 150 expense
      expect(totalIncome).toBe(2000);
      expect(totalExpense).toBe(150);
      expect(balance).toBe(1850); // 2000 - 150

      // Verify transactions are sorted by date (newest first)
      if (response.body.transactions.length > 1) {
        const dates = response.body.transactions.map((t: any) => new Date(t.date).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }

      // Verify each transaction has required fields
      response.body.transactions.forEach((transaction: any) => {
        expect(transaction).toHaveProperty('_id');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('category');
        expect(transaction).toHaveProperty('date');
        expect(['income', 'expense']).toContain(transaction.type);
      });
    });

    it('should return empty transactions for non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439999';
      const response = await httpAgent
        .get(`/transactions/${fakeUserId}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return empty transactions and zero summary for user with no transactions', async () => {
      // Create a new user with no transactions
      const newUserData = {
        name: 'No Transactions User',
        email: 'notransactions@example.com',
        password: 'password123',
      };

      const registerResponse = await httpAgent
        .post('/users/register')
        .send(newUserData)
        .expect(201);

      const newUserId = registerResponse.body._id;

      const response = await httpAgent
        .get(`/transactions/${newUserId}`)
        .expect(200);

      expect(response.body.transactions).toEqual([]);
      expect(response.body.summary).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      });
    });
  });
});

