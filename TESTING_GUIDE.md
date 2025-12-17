# Complete Testing Guide - Finance Tracker

This guide provides step-by-step instructions for running all tests in the Finance Tracker project.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Testing](#backend-testing)
   - [Unit Tests](#1-backend-unit-tests)
   - [Integration Tests](#2-backend-integration-tests)
   - [E2E Tests](#3-backend-e2e-tests)
3. [Frontend Testing](#frontend-testing)
   - [Unit Tests](#1-frontend-unit-tests)
   - [E2E Tests with Cypress](#2-frontend-e2e-tests-with-cypress)
4. [Running All Tests](#running-all-tests)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install Dependencies

Make sure all dependencies are installed:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Environment Variables

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/finance-tracker-test
PORT=3000
```

**Frontend** - No environment variables needed for testing (uses default `http://localhost:3000`)

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service, it should auto-start)
# Or start manually:
mongod

# Mac/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod
```

---

## Backend Testing

### Test Structure

Backend tests are located in `backend/test/`:
- **Unit Tests**: `backend/src/**/*.spec.ts` (service tests)
- **Integration Tests**: `backend/test/**/*.int-spec.ts`
- **E2E Tests**: `backend/test/**/*.e2e-spec.ts`

### 1. Backend Unit Tests

**Purpose**: Test individual service methods in isolation using mocks.

**Location**: `backend/src/**/*.spec.ts`

**What They Test**:
- User service methods (register, login, findById)
- Budget service methods (create, getBudget, calculateBudget)
- Transaction service methods (create, getUserTransactions)

**How to Run**:

```bash
cd backend

# Run all unit tests
npm test

# Run in watch mode (reruns on file changes)
npm run test:watch

# Run with coverage report
npm run test:cov

# Run a specific test file
npm test -- users.service.spec.ts
```

**Expected Output**:
```
PASS  src/users/users.service.spec.ts
PASS  src/budgets/budgets.service.spec.ts
PASS  src/transactions/transactions.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       15+ passed, 15+ total
```

**What to Look For**:
- ✅ All tests passing
- ✅ No errors or warnings
- ✅ Coverage percentage (aim for >80%)

---

### 2. Backend Integration Tests

**Purpose**: Test services with real database connections but isolated from HTTP layer.

**Location**: `backend/test/**/*.int-spec.ts`
- `users.int-spec.ts`
- `budgets.int-spec.ts`
- `transactions.int-spec.ts`

**What They Test**:
- Service methods with actual database operations
- Data persistence and retrieval
- Business logic validation
- Error handling with real database

**How to Run**:

```bash
cd backend

# Run all integration tests
npm run test:int

# Run a specific integration test
npm run test:int -- budgets.int-spec.ts
```

**Expected Output**:
```
PASS  test/users.int-spec.ts
PASS  test/budgets.int-spec.ts
PASS  test/transactions.int-spec.ts

Test Suites: 3 passed, 3 total
Tests:       20+ passed, 20+ total
```

**What to Look For**:
- ✅ All tests passing
- ✅ Database operations working correctly
- ✅ Data cleanup (tests should not leave data behind)

**Note**: Integration tests use a separate test database (`finance-tracker-test`) and clean up after themselves.

---

### 3. Backend E2E Tests

**Purpose**: Test the entire application through HTTP endpoints (full request/response cycle).

**Location**: `backend/test/**/*.e2e-spec.ts`
- `finance-tracker.e2e-spec.ts` - Complete workflow tests
- `app.e2e-spec.ts` - Basic app tests

**What They Test**:
- HTTP endpoints (GET, POST, PUT, DELETE)
- Request/response flow
- Authentication and authorization
- Error responses and status codes
- Complete user workflows

**How to Run**:

```bash
cd backend

# Run all E2E tests
npm run test:e2e

# Run a specific E2E test
npm run test:e2e -- finance-tracker.e2e-spec.ts
```

**Expected Output**:
```
PASS  test/finance-tracker.e2e-spec.ts
PASS  test/app.e2e-spec.ts

Test Suites: 2 passed, 2 total
Tests:       15+ passed, 15+ total
```

**What to Look For**:
- ✅ All HTTP requests succeed
- ✅ Status codes are correct (200, 201, 400, 404, etc.)
- ✅ Response bodies match expected format
- ✅ Complete workflows execute successfully

**Note**: E2E tests start a test server and make actual HTTP requests. They clean up test data.

---

## Frontend Testing

### Test Structure

Frontend tests are located in `frontend/test/`:
- **Unit Tests**: `frontend/test/unit/**/*.test.{js,jsx}`
- **E2E Tests**: `frontend/cypress/e2e/**/*.cy.js`

### 1. Frontend Unit Tests

**Purpose**: Test React components, services, and utilities in isolation.

**Location**: `frontend/test/unit/`

**Test Files**:
- `components/Login.test.jsx` - Login component
- `components/Register.test.jsx` - Register component
- `components/AddTransaction.test.jsx` - AddTransaction component
- `components/BudgetForm.test.jsx` - BudgetForm component
- `services/api.test.js` - API service (Factory Pattern)
- `services/notification.test.js` - Notification service (Observer Pattern)
- `utils/dateUtils.test.js` - Date utility functions

**What They Test**:
- Component rendering
- User interactions (clicks, form inputs)
- Form validation
- API service methods
- Utility functions
- Error handling

**How to Run**:

```bash
cd frontend

# Run all unit tests
npm test

# Run in watch mode (reruns on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run for CI (single run with coverage)
npm run test:ci

# Run a specific test file
npm test -- Login.test.jsx
```

**Expected Output**:
```
PASS  test/unit/components/Login.test.jsx
PASS  test/unit/components/Register.test.jsx
PASS  test/unit/components/AddTransaction.test.jsx
PASS  test/unit/components/BudgetForm.test.jsx
PASS  test/unit/services/api.test.js
PASS  test/unit/services/notification.test.js
PASS  test/unit/utils/dateUtils.test.js

Test Suites: 7 passed, 7 total
Tests:       40+ passed, 40+ total
```

**What to Look For**:
- ✅ All tests passing
- ✅ Components render correctly
- ✅ User interactions work as expected
- ✅ Mock API calls succeed
- ✅ Coverage percentage (aim for >70%)

**Coverage Report**:
After running `npm run test:coverage`, open `frontend/coverage/lcov-report/index.html` in a browser to see detailed coverage.

---

### 2. Frontend E2E Tests with Cypress

**Purpose**: Test the entire application from a user's perspective in a real browser.

**Location**: `frontend/cypress/e2e/`

**Test Files**:
- `auth.cy.js` - Authentication flows (register, login)
- `transactions.cy.js` - Transaction management
- `budgets.cy.js` - Budget management
- `user-journey.cy.js` - Complete user workflow

**What They Test**:
- Complete user workflows
- UI interactions in real browser
- Integration between frontend and backend
- Navigation and routing
- Form submissions and validations
- Error messages and success notifications

**Prerequisites for E2E Tests**:
1. **Backend server must be running** on `http://localhost:3000`
2. **Frontend server must be running** on `http://localhost:5173`

**Step-by-Step Setup**:

#### Step 1: Start Backend Server

```bash
# Terminal 1 - Start backend
cd backend
npm run start:dev
```

Wait until you see:
```
[Nest] 1234  - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 1234  - 01/01/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 1234  - 01/01/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
```

#### Step 2: Start Frontend Server

```bash
# Terminal 2 - Start frontend
cd frontend
npm run dev
```

Wait until you see:
```
  VITE v7.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### Step 3: Run Cypress Tests

**Option A: Headless Mode (CI/CD)** - Runs tests without opening browser window:

```bash
# Terminal 3 - Run Cypress in headless mode
cd frontend
npm run test:e2e
```

**Option B: Interactive Mode** - Opens Cypress UI for debugging:

```bash
# Terminal 3 - Open Cypress UI
cd frontend
npm run test:e2e:open
# Or
npm run cypress:open
```

Then in the Cypress UI:
1. Click "E2E Testing"
2. Select a browser (Chrome, Electron, etc.)
3. Click on a test file to run it
4. Watch the tests execute in real-time

**Expected Output (Headless)**:
```
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:        13.17.0                                                    │
  │ Browser:        Electron 118 (headless)                                    │
  │ Specs:          4 found (auth.cy.js, budgets.cy.js, transactions.cy.js,   │
  │                  user-journey.cy.js)                                       │
  └────────────────────────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────

  Running:  auth.cy.js                                                   (1 of 4)

  Authentication Flow
    User Registration
      ✓ should successfully register a new user (5000ms)
      ✓ should display error message for duplicate email (3000ms)
      ✓ should validate required fields (500ms)
    User Login
      ✓ should successfully login with valid credentials (3000ms)
      ✓ should display error message for invalid credentials (2000ms)
      ✓ should validate login form fields (200ms)

  6 passing (15s)

────────────────────────────────────────────────────────────────────────────────

  Running:  transactions.cy.js                                          (2 of 4)

  Transaction Management Flow
    Add Income Transaction
      ✓ should successfully add an income transaction (3000ms)
    Add Expense Transaction
      ✓ should successfully add an expense transaction (3000ms)
    View Transactions
      ✓ should display transactions list with summary (2000ms)
    Transaction Validation
      ✓ should require userId to add transaction (1000ms)

  4 passing (10s)

────────────────────────────────────────────────────────────────────────────────

  Running:  budgets.cy.js                                               (3 of 4)

  Budget Management Flow
    Set Budget
      ✓ should successfully set a monthly budget (2000ms)
      ✓ should display error for invalid budget amount (1000ms)
      ✓ should require userId to set budget (1000ms)
    View Budget Status
      ✓ should display budget summary after setting budget (2000ms)
      ✓ should show warning when budget usage exceeds 90% (5000ms)
    View All Budgets
      ✓ should display list of all budgets (2000ms)

  6 passing (15s)

────────────────────────────────────────────────────────────────────────────────

  Running:  user-journey.cy.js                                          (4 of 4)

  Complete User Journey
    ✓ should complete full user workflow: Register → Login → Set Budget → 
      Add Transactions → View Dashboard (25000ms)

  1 passing (25s)

====================================================================================================

  (Run Finished)

       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────┐
  │ ✓  auth.cy.js                              00:15        6        6        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────┤
  │ ✓  transactions.cy.js                      00:10        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────┤
  │ ✓  budgets.cy.js                           00:15        6        6        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────┤
  │ ✓  user-journey.cy.js                      00:25        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────┘
    ✓  4 of 4 passed (100%)                      01:05       17       17        -        -        -

```

**What to Look For**:
- ✅ All tests passing (✓)
- ✅ No timeout errors
- ✅ Forms submit successfully
- ✅ Navigation works correctly
- ✅ Error messages display when expected
- ✅ Success notifications appear

**Common Issues**:
- If tests fail with "element not found", check that both servers are running
- If tests timeout, increase timeout in `cypress.config.cjs` or check network
- If backend errors occur, check MongoDB is running

---

## Running All Tests

### Complete Test Suite (Recommended Order)

1. **Backend Tests** (in order):
   ```bash
   cd backend
   npm test              # Unit tests
   npm run test:int      # Integration tests
   npm run test:e2e      # E2E tests
   ```

2. **Frontend Tests**:
   ```bash
   cd frontend
   npm test              # Unit tests
   
   # Then start servers and run E2E:
   # Terminal 1: cd backend && npm run start:dev
   # Terminal 2: cd frontend && npm run dev
   # Terminal 3: cd frontend && npm run test:e2e
   ```

### Quick Test Script

Create a script to run all tests at once (optional):

```bash
# In project root, create test-all.sh (Mac/Linux) or test-all.bat (Windows)
```

---

## Test Coverage Summary

### Backend Coverage

Run coverage report:
```bash
cd backend
npm run test:cov
```

Expected coverage:
- **Unit Tests**: Services, repositories
- **Integration Tests**: Service + database
- **E2E Tests**: Full HTTP flow

View detailed coverage in `backend/coverage/lcov-report/index.html`

### Frontend Coverage

Run coverage report:
```bash
cd frontend
npm run test:coverage
```

Expected coverage:
- **Components**: Login, Register, AddTransaction, BudgetForm
- **Services**: API factory, Notification observer
- **Utils**: Date utilities

View detailed coverage in `frontend/coverage/lcov-report/index.html`

---

## Troubleshooting

### Backend Test Issues

**Problem**: Tests fail with MongoDB connection error
- **Solution**: Make sure MongoDB is running (`mongod` or check service status)

**Problem**: Port 3000 already in use
- **Solution**: Kill the process using port 3000 or change PORT in `.env`

**Problem**: Tests timeout
- **Solution**: Increase timeout in `jest.config.js` or check database connection

### Frontend Test Issues

**Problem**: Jest tests fail with "Cannot find module"
- **Solution**: Run `npm install` in frontend directory

**Problem**: Cypress tests fail with "element not found"
- **Solution**: 
  1. Ensure both backend and frontend servers are running
  2. Check that the app loads in browser at `http://localhost:5173`
  3. Verify selectors in test files match actual HTML

**Problem**: Cypress can't connect to backend
- **Solution**: 
  1. Check backend is running on `http://localhost:3000`
  2. Test backend endpoint: `curl http://localhost:3000/users` (should return 404 or error, not connection refused)

**Problem**: Tests pass but coverage is low
- **Solution**: Add more test cases for edge cases and error paths

### General Issues

**Problem**: `npm install` fails
- **Solution**: 
  1. Delete `node_modules` and `package-lock.json`
  2. Run `npm install` again
  3. Use `npm install --legacy-peer-deps` if peer dependency conflicts occur

**Problem**: Tests are slow
- **Solution**: 
  1. Use `test:watch` for development (runs only changed files)
  2. Use `--maxWorkers=2` to limit parallel test execution
  3. Consider using test databases in memory for faster execution

---

## Best Practices

1. **Run tests before committing**: `npm test` in both backend and frontend
2. **Fix failing tests immediately**: Don't let tests fail in CI/CD
3. **Write tests first (TDD)**: Write tests before implementing features
4. **Keep tests isolated**: Each test should be independent
5. **Use descriptive test names**: `it('should create a budget when valid data is provided')`
6. **Clean up after tests**: Remove test data and reset state
7. **Mock external dependencies**: Use mocks for API calls and external services
8. **Test edge cases**: Include tests for error conditions and boundary values

---

## Test Execution Time Estimates

- **Backend Unit Tests**: ~5-10 seconds
- **Backend Integration Tests**: ~10-20 seconds
- **Backend E2E Tests**: ~15-30 seconds
- **Frontend Unit Tests**: ~10-15 seconds
- **Frontend E2E Tests (Cypress)**: ~60-120 seconds

**Total Time**: ~2-4 minutes for complete test suite

---

## Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Cypress Documentation**: https://docs.cypress.io/
- **React Testing Library**: https://testing-library.com/react
- **NestJS Testing**: https://docs.nestjs.com/fundamentals/testing

---

## Summary Checklist

Before considering testing complete, ensure:

- [ ] All backend unit tests pass
- [ ] All backend integration tests pass
- [ ] All backend E2E tests pass
- [ ] All frontend unit tests pass
- [ ] All frontend E2E tests pass
- [ ] Test coverage is above 70% for both backend and frontend
- [ ] No test warnings or errors
- [ ] All test data is cleaned up properly
- [ ] Tests run successfully in CI/CD environment (if applicable)
