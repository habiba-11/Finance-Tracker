# Finance Tracker - Frontend

React + Vite frontend application for the Finance Tracker project.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Testing

### Unit Tests (Jest)

Run unit tests using Jest:

```bash
npm test                 # Run tests once
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:ci         # Run tests in CI mode (with coverage, no watch)
```

**Test Structure:**
- Unit tests are located in `test/unit/` directory
- Tests are organized to mirror the `src/` directory structure
- Component tests: `test/unit/components/`
- Service tests: `test/unit/services/`
- Utility tests: `test/unit/utils/`

### End-to-End Tests (Cypress)

Run E2E tests using Cypress:

```bash
npm run test:e2e        # Run tests headlessly
npm run test:e2e:open   # Open Cypress Test Runner (interactive)
```

**Note**: Make sure both frontend and backend servers are running before running E2E tests:
1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `npm run dev`
3. Run Cypress tests: `npm run test:e2e`

**E2E Test Structure:**
- E2E tests are located in `cypress/e2e/` directory
- Test files: `auth.cy.js`, `transactions.cy.js`, `budgets.cy.js`, `user-journey.cy.js`
- Support files: `cypress/support/` (commands, configuration)

## Project Structure

```
frontend/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API and service layer
│   ├── utils/              # Utility functions
│   └── styles/             # CSS styles
├── test/                   # Unit tests
│   ├── unit/               # Unit test files
│   └── setup/              # Test setup files
├── cypress/                # E2E tests
│   ├── e2e/                # E2E test files
│   └── support/            # Cypress support files
└── public/                 # Static assets
```

## Technologies

- React 19
- Vite
- React Router DOM
- Jest (Unit Testing)
- React Testing Library
- Cypress (E2E Testing)
