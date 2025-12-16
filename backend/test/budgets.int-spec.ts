import { INestApplication } from '@nestjs/common';
import { createTestApp, stopMongoMemoryServer, getRequestAgent } from './test-setup';
import * as request from 'supertest';

describe('Budgets Integration Tests (e2e)', () => {
  let app: INestApplication;
  let httpAgent: request.SuperTest<request.Test>;
  let userId: string;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  beforeAll(async () => {
    app = await createTestApp();
    httpAgent = getRequestAgent(app);

    // Register a user for budget tests
    const userData = {
      name: 'Budget Test User',
      email: 'budgettest@example.com',
      password: 'password123',
    };

    const registerResponse = await httpAgent
      .post('/users/register')
      .send(userData)
      .expect(201);

    userId = registerResponse.body._id;
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('POST /budgets', () => {
    it('should create a budget successfully', async () => {
      const budgetData = {
        userId,
        month: nextMonth,
        year: nextYear,
        amount: 1000,
      };

      const response = await httpAgent
        .post('/budgets')
        .send(budgetData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('month', budgetData.month);
      expect(response.body).toHaveProperty('year', budgetData.year);
      expect(response.body).toHaveProperty('amount', budgetData.amount);
    });

    it('should fail to create duplicate budget for same month/year', async () => {
      const budgetData = {
        userId,
        month: nextMonth,
        year: nextYear,
        amount: 1500,
      };

      const response = await httpAgent
        .post('/budgets')
        .send(budgetData)
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already set');
    });

    it('should fail to create budget for past month', async () => {
      const pastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const pastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const budgetData = {
        userId,
        month: pastMonth,
        year: pastYear,
        amount: 1000,
      };

      const response = await httpAgent
        .post('/budgets')
        .send(budgetData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('past months');
    });

    it('should fail to create budget with invalid userId', async () => {
      const budgetData = {
        userId: 'invalid-id',
        month: nextMonth,
        year: nextYear,
        amount: 1000,
      };

      const response = await httpAgent
        .post('/budgets')
        .send(budgetData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail to create budget with missing required fields', async () => {
      const budgetData = {
        userId,
        // Missing month, year, amount
      };

      const response = await httpAgent
        .post('/budgets')
        .send(budgetData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /budgets/:userId/:month/:year', () => {
    let budgetId: string;
    const testMonth = nextMonth === 12 ? 1 : nextMonth + 1;
    const testYear = nextMonth === 12 ? nextYear + 1 : nextYear;

    beforeAll(async () => {
      // Create a budget for testing
      const budgetData = {
        userId,
        month: testMonth,
        year: testYear,
        amount: 2000,
      };

      const createResponse = await httpAgent
        .post('/budgets')
        .send(budgetData)
        .expect(201);

      budgetId = createResponse.body._id;

      // Create some expense transactions for this month
      const expenses = [
        {
          userId,
          amount: 500,
          type: 'expense',
          category: 'Food',
          date: `${testYear}-${String(testMonth).padStart(2, '0')}-15`,
        },
        {
          userId,
          amount: 300,
          type: 'expense',
          category: 'Transport',
          date: `${testYear}-${String(testMonth).padStart(2, '0')}-20`,
        },
      ];

      for (const expense of expenses) {
        await httpAgent.post('/transactions').send(expense).expect(201);
      }
    });

    it('should get budget with correct spending calculations', async () => {
      const response = await httpAgent
        .get(`/budgets/${userId}/${testMonth}/${testYear}`)
        .expect(200);

      expect(response.body).toHaveProperty('budget');
      expect(response.body.budget).toHaveProperty('_id', budgetId);
      expect(response.body.budget).toHaveProperty('amount', 2000);
      expect(response.body).toHaveProperty('totalSpent', 800); // 500 + 300
      expect(response.body).toHaveProperty('remaining', 1200); // 2000 - 800
      expect(response.body).toHaveProperty('percentage');
      expect(response.body).toHaveProperty('status');

      // Verify percentage calculation
      const expectedPercentage = (800 / 2000) * 100;
      expect(response.body.percentage).toBeCloseTo(expectedPercentage, 2);

      // Verify status based on percentage
      const percentage = response.body.percentage;
      if (percentage >= 100) {
        expect(response.body.status).toBe('over_budget');
      } else if (percentage >= 90) {
        expect(response.body.status).toBe('warning');
      } else if (percentage >= 70) {
        expect(response.body.status).toBe('caution');
      } else {
        expect(response.body.status).toBe('on_track');
      }
    });

    it('should return message when no budget is set for the month', async () => {
      const noBudgetMonth = testMonth === 12 ? 1 : testMonth + 1;
      const noBudgetYear = testMonth === 12 ? testYear + 1 : testYear;

      const response = await httpAgent
        .get(`/budgets/${userId}/${noBudgetMonth}/${noBudgetYear}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No budget set');
    });

    it('should handle budget with no expenses correctly', async () => {
      // Create a budget for a different month
      const emptyBudgetMonth = testMonth === 11 ? 1 : testMonth + 1;
      const emptyBudgetYear = testMonth === 11 ? testYear + 1 : testYear;

      const budgetData = {
        userId,
        month: emptyBudgetMonth,
        year: emptyBudgetYear,
        amount: 1500,
      };

      await httpAgent.post('/budgets').send(budgetData).expect(201);

      const response = await httpAgent
        .get(`/budgets/${userId}/${emptyBudgetMonth}/${emptyBudgetYear}`)
        .expect(200);

      expect(response.body).toHaveProperty('budget');
      expect(response.body).toHaveProperty('totalSpent', 0);
      expect(response.body).toHaveProperty('remaining', 1500);
      expect(response.body).toHaveProperty('percentage', 0);
      expect(response.body).toHaveProperty('status', 'on_track');
    });
  });

  describe('GET /budgets/all/:userId', () => {
    it('should get all budgets for a user with spending calculations', async () => {
      const response = await httpAgent
        .get(`/budgets/all/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('budgets');
      expect(Array.isArray(response.body.budgets)).toBe(true);
      expect(response.body.budgets.length).toBeGreaterThan(0);

      // Verify each budget has spending calculations
      for (const budgetItem of response.body.budgets) {
        expect(budgetItem).toHaveProperty('budget');
        expect(budgetItem).toHaveProperty('totalSpent');
        expect(budgetItem).toHaveProperty('remaining');
        expect(budgetItem).toHaveProperty('percentage');
        expect(budgetItem).toHaveProperty('status');

        // Verify calculations
        const { budget, totalSpent, remaining } = budgetItem;
        expect(remaining).toBe(budget.amount - totalSpent);
      }

      // Verify budgets are sorted by year and month (newest first)
      if (response.body.budgets.length > 1) {
        for (let i = 0; i < response.body.budgets.length - 1; i++) {
          const current = response.body.budgets[i].budget;
          const next = response.body.budgets[i + 1].budget;
          const currentDate = new Date(current.year, current.month - 1);
          const nextDate = new Date(next.year, next.month - 1);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });

    it('should return empty array for user with no budgets', async () => {
      // Create a new user with no budgets
      const newUserData = {
        name: 'No Budgets User',
        email: 'nobudgets@example.com',
        password: 'password123',
      };

      const registerResponse = await httpAgent
        .post('/users/register')
        .send(newUserData)
        .expect(201);

      const newUserId = registerResponse.body._id;

      const response = await httpAgent
        .get(`/budgets/all/${newUserId}`)
        .expect(200);

      expect(response.body.budgets).toEqual([]);
    });

    it('should fail with invalid userId', async () => {
      const response = await httpAgent
        .get('/budgets/all/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});

