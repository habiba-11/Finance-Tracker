# Finance Tracker

A full-stack finance tracking application with budget management and transaction tracking.

## Project Overview

This project consists of:
- **Backend**: NestJS + MongoDB REST API
- **Frontend**: React + Vite SPA

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or remote)
- npm or yarn

### Installation

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### Running the Application

#### Backend
```bash
cd backend
npm run start:dev
```
Backend runs on `http://localhost:3000`

#### Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

## Testing

### Backend Tests
```bash
cd backend
npm test              # Unit tests
npm run test:int      # Integration tests
npm run test:e2e      # E2E tests
```

### Frontend Tests
```bash
cd frontend
npm test              # Unit tests (Jest)
npm run test:e2e      # E2E tests (Cypress)
```

**Note**: For frontend E2E tests, ensure both backend and frontend servers are running.

### Running All Tests

Run backend and frontend tests separately (each requires its own environment setup).

## Project Structure

```
Finance-Tracker/
├── backend/           # NestJS backend
│   ├── src/           # Source code
│   └── test/          # Backend tests
├── frontend/          # React frontend
│   ├── src/           # Source code
│   ├── test/          # Unit tests
│   └── cypress/       # E2E tests
└── docs/              # Documentation
```

## Features

- User registration and authentication
- Transaction management (income/expense)
- Budget management and tracking
- Budget status indicators
- Transaction categorization
- Financial summaries and reports

## Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Milestone 3 Deliverables](MILESTONE_3_DELIVERABLES.md)
- [Test Coverage](backend/TEST_COVERAGE.md)
- [TDD Guide](TDD_DEMONSTRATION_GUIDE.md)