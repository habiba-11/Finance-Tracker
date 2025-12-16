import { INestApplication } from '@nestjs/common';
import { createTestApp, stopMongoMemoryServer, getRequestAgent, clearDatabase } from './test-setup';
import * as request from 'supertest';

/**
 * Comprehensive E2E Tests for Finance Tracker
 * 
 * These tests cover complete user flows:
 * 1. User Registration → Login → Set Budget → Add Transactions → View Dashboard
 * 2. Full transaction lifecycle
 * 3. Budget tracking and calculations
 * 4. Error scenarios and edge cases
 */
describe('Finance Tracker E2E Tests - Complete User Flows', () => {
  let app: INestApplication;
  let httpAgent: request.SuperTest<request.Test>;

  beforeAll(async () => {
    app = await createTestApp();
    httpAgent = getRequestAgent(app);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  beforeEach(async () => {
    await clearDatabase(app);
  });

  describe('Complete User Journey: Register → Login → Set Budget → Add Transactions → View Dashboard', () => {
    let userId: string;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    it('should complete full user journey successfully', async () => {
      // Step 1: Register a new user
      const registerResponse = await httpAgent
        .post('/users/register')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(registerResponse.body).toHaveProperty('_id');
      expect(registerResponse.body).toHaveProperty('name', 'John Doe');
      expect(registerResponse.body).toHaveProperty('email', 'john.doe@example.com');
      expect(registerResponse.body).not.toHaveProperty('password');
      expect(registerResponse.body).not.toHaveProperty('passwordHash');

      userId = registerResponse.body._id;

      // Step 2: Login with registered user
      const loginResponse = await httpAgent
        .post('/users/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('message', 'Login successful');
      expect(loginResponse.body).toHaveProperty('userId', userId);

      // Step 3: Set a budget for next month
      const budgetResponse = await httpAgent
        .post('/budgets')
        .send({
          userId,
          month: nextMonth,
          year: nextYear,
          amount: 5000,
        })
        .expect(201);

      expect(budgetResponse.body).toHaveProperty('_id');
      expect(budgetResponse.body).toHaveProperty('amount', 5000);
      expect(budgetResponse.body).toHaveProperty('month', nextMonth);
      expect(budgetResponse.body).toHaveProperty('year', nextYear);

      // Step 4: Add income transaction
      const incomeResponse = await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 6000,
          type: 'income',
          category: 'Salary',
          date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
          description: 'Monthly salary',
        })
        .expect(201);

      expect(incomeResponse.body).toHaveProperty('_id');
      expect(incomeResponse.body).toHaveProperty('amount', 6000);
      expect(incomeResponse.body).toHaveProperty('type', 'income');
      expect(incomeResponse.body).toHaveProperty('category', 'Salary');

      // Step 5: Add expense transactions
      const expense1Response = await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 1500,
          type: 'expense',
          category: 'Rent',
          date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-05`,
          description: 'Monthly rent',
        })
        .expect(201);

      expect(expense1Response.body).toHaveProperty('_id');
      expect(expense1Response.body).toHaveProperty('type', 'expense');
      expect(expense1Response.body).toHaveProperty('category', 'Rent');

      const expense2Response = await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 800,
          type: 'expense',
          category: 'Food',
          date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-10`,
          description: 'Groceries',
        })
        .expect(201);

      // Step 6: Get all transactions and verify summary
      const transactionsResponse = await httpAgent
        .get(`/transactions/${userId}`)
        .expect(200);

      expect(transactionsResponse.body).toHaveProperty('transactions');
      expect(transactionsResponse.body).toHaveProperty('summary');
      expect(transactionsResponse.body.transactions.length).toBe(3);
      expect(transactionsResponse.body.summary.totalIncome).toBe(6000);
      expect(transactionsResponse.body.summary.totalExpense).toBe(2300); // 1500 + 800
      expect(transactionsResponse.body.summary.balance).toBe(3700); // 6000 - 2300

      // Step 7: Get budget and verify spending calculations
      const budgetViewResponse = await httpAgent
        .get(`/budgets/${userId}/${nextMonth}/${nextYear}`)
        .expect(200);

      expect(budgetViewResponse.body).toHaveProperty('budget');
      expect(budgetViewResponse.body).toHaveProperty('totalSpent', 2300);
      expect(budgetViewResponse.body).toHaveProperty('remaining', 2700); // 5000 - 2300
      expect(budgetViewResponse.body).toHaveProperty('percentage');
      expect(budgetViewResponse.body).toHaveProperty('status');
      
      // Verify percentage calculation (2300 / 5000 * 100 = 46%)
      expect(budgetViewResponse.body.percentage).toBeCloseTo(46, 0);
      expect(budgetViewResponse.body.status).toBe('on_track'); // Less than 70%
    });
  });

  describe('Transaction Lifecycle: Multiple Transactions with Different Categories', () => {
    let userId: string;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    beforeEach(async () => {
      // Register and login user
      const registerResponse = await httpAgent
        .post('/users/register')
        .send({
          name: 'Transaction Test User',
          email: `transaction-${Date.now()}@example.com`,
          password: 'password123',
        })
        .expect(201);
      userId = registerResponse.body._id;
    });

    it('should handle multiple income and expense transactions correctly', async () => {
      // Add multiple income transactions
      const incomes = [
        { amount: 5000, category: 'Salary', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01` },
        { amount: 1000, category: 'Freelance', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15` },
        { amount: 500, category: 'Bonus', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-20` },
      ];

      for (const income of incomes) {
        await httpAgent
          .post('/transactions')
          .send({
            userId,
            amount: income.amount,
            type: 'income',
            category: income.category,
            date: income.date,
          })
          .expect(201);
      }

      // Add multiple expense transactions
      const expenses = [
        { amount: 1200, category: 'Rent', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-05` },
        { amount: 600, category: 'Food', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-10` },
        { amount: 300, category: 'Transport', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-12` },
        { amount: 200, category: 'Entertainment', date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-18` },
      ];

      for (const expense of expenses) {
        await httpAgent
          .post('/transactions')
          .send({
            userId,
            amount: expense.amount,
            type: 'expense',
            category: expense.category,
            date: expense.date,
          })
          .expect(201);
      }

      // Verify transaction summary
      const response = await httpAgent
        .get(`/transactions/${userId}`)
        .expect(200);

      expect(response.body.transactions.length).toBe(7); // 3 income + 4 expense
      expect(response.body.summary.totalIncome).toBe(6500); // 5000 + 1000 + 500
      expect(response.body.summary.totalExpense).toBe(2300); // 1200 + 600 + 300 + 200
      expect(response.body.summary.balance).toBe(4200); // 6500 - 2300

      // Verify transactions are sorted by date (newest first)
      const dates = response.body.transactions.map((t: any) => new Date(t.date).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });
  });

  describe('Budget Tracking: Multiple Budgets Across Different Months', () => {
    let userId: string;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1;
    const yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear;

    beforeEach(async () => {
      const registerResponse = await httpAgent
        .post('/users/register')
        .send({
          name: 'Budget Test User',
          email: `budget-${Date.now()}@example.com`,
          password: 'password123',
        })
        .expect(201);
      userId = registerResponse.body._id;
    });

    it('should track budgets across multiple months with correct spending', async () => {
      // Create budgets for next two months
      const budget1 = await httpAgent
        .post('/budgets')
        .send({
          userId,
          month: nextMonth,
          year: nextYear,
          amount: 3000,
        })
        .expect(201);

      const budget2 = await httpAgent
        .post('/budgets')
        .send({
          userId,
          month: monthAfterNext,
          year: yearAfterNext,
          amount: 4000,
        })
        .expect(201);

      // Add expenses for first month
      await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 1500,
          type: 'expense',
          category: 'Rent',
          date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-05`,
        })
        .expect(201);

      await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 800,
          type: 'expense',
          category: 'Food',
          date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-10`,
        })
        .expect(201);

      // Add expenses for second month
      await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 2000,
          type: 'expense',
          category: 'Rent',
          date: `${yearAfterNext}-${String(monthAfterNext).padStart(2, '0')}-05`,
        })
        .expect(201);

      // Get all budgets
      const allBudgetsResponse = await httpAgent
        .get(`/budgets/all/${userId}`)
        .expect(200);

      expect(allBudgetsResponse.body.budgets.length).toBe(2);

      // Verify first budget calculations
      const budget1Data = allBudgetsResponse.body.budgets.find(
        (b: any) => b.budget._id === budget1.body._id
      );
      expect(budget1Data.totalSpent).toBe(2300); // 1500 + 800
      expect(budget1Data.remaining).toBe(700); // 3000 - 2300
      expect(budget1Data.percentage).toBeCloseTo(76.67, 1);
      expect(budget1Data.status).toBe('caution'); // Between 70-90%

      // Verify second budget calculations
      const budget2Data = allBudgetsResponse.body.budgets.find(
        (b: any) => b.budget._id === budget2.body._id
      );
      expect(budget2Data.totalSpent).toBe(2000);
      expect(budget2Data.remaining).toBe(2000); // 4000 - 2000
      expect(budget2Data.percentage).toBe(50);
      expect(budget2Data.status).toBe('on_track'); // Less than 70%

      // Verify budgets are sorted by date (newest first)
      const dates = allBudgetsResponse.body.budgets.map((b: any) => 
        new Date(b.budget.year, b.budget.month - 1).getTime()
      );
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    let userId: string;

    beforeEach(async () => {
      const registerResponse = await httpAgent
        .post('/users/register')
        .send({
          name: 'Error Test User',
          email: `error-${Date.now()}@example.com`,
          password: 'password123',
        })
        .expect(201);
      userId = registerResponse.body._id;
    });

    it('should handle validation errors correctly', async () => {
      // Test invalid email format
      await httpAgent
        .post('/users/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      // Test missing required fields
      await httpAgent
        .post('/transactions')
        .send({
          userId,
          // Missing amount, type, date
        })
        .expect(400);

      // Test invalid transaction type
      await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 100,
          type: 'invalid-type',
          category: 'Food',
          date: '2024-12-15',
        })
        .expect(400);

      // Test negative amount
      await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: -100,
          type: 'expense',
          category: 'Food',
          date: '2024-12-15',
        })
        .expect(400);

      // Test invalid date format
      await httpAgent
        .post('/transactions')
        .send({
          userId,
          amount: 100,
          type: 'expense',
          category: 'Food',
          date: 'invalid-date',
        })
        .expect(400);
    });

    it('should handle duplicate budget creation', async () => {
      const currentDate = new Date();
      const nextMonth = currentDate.getMonth() === 11 ? 1 : currentDate.getMonth() + 2;
      const nextYear = currentDate.getMonth() === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();

      // Create first budget
      await httpAgent
        .post('/budgets')
        .send({
          userId,
          month: nextMonth,
          year: nextYear,
          amount: 3000,
        })
        .expect(201);

      // Try to create duplicate budget
      await httpAgent
        .post('/budgets')
        .send({
          userId,
          month: nextMonth,
          year: nextYear,
          amount: 4000,
        })
        .expect(409); // Conflict
    });

    it('should handle non-existent user scenarios', async () => {
      const fakeUserId = '507f1f77bcf86cd799439999';

      await httpAgent
        .get(`/transactions/${fakeUserId}`)
        .expect(400);

      await httpAgent
        .get(`/budgets/${fakeUserId}/12/2024`)
        .expect(400);
    });
  });
});

