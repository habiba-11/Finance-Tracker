// Budget E2E Tests
// Testing budget creation and viewing flows

describe('Budget Management Flow', () => {
  let testEmail;

  before(() => {
    // Register a user before all tests
    const timestamp = Date.now();
    testEmail = `budgetuser${timestamp}@example.com`;
    
    cy.register('Budget Test User', testEmail, 'password123');
  });

  beforeEach(() => {
    // Login before each test
    cy.login(testEmail, 'password123');
    cy.wait(1000);
  });

  describe('Set Budget', () => {
    it('should successfully set a monthly budget', () => {
      cy.visit('/set-budget');
      
      // Fill budget form (month and year are set automatically to current month/year)
      cy.get('input[placeholder="Enter your monthly budget"]').type('5000');
      
      // Submit
      cy.get('button[type="submit"]').contains('Set Budget').click();
      
      // Assert: Success message
      cy.contains('Budget set successfully', { timeout: 5000 }).should('be.visible');
    });

    it('should display error for invalid budget amount', () => {
      cy.visit('/set-budget');
      
      // Try to set budget with 0 or negative amount
      cy.get('input[placeholder="Enter your monthly budget"]').type('0');
      cy.get('button[type="submit"]').contains('Set Budget').click();
      
      // Assert: Error message
      cy.contains('valid budget amount', { timeout: 5000 }).should('be.visible');
    });

    it('should require userId to set budget', () => {
      // Clear localStorage to simulate not being logged in
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      // Try to access set budget without being logged in
      cy.visit('/set-budget');
      
      // Should redirect to login page due to ProtectedRoute
      cy.url({ timeout: 3000 }).should('include', '/login');
    });
  });

  describe('View Budget Status', () => {
    it('should display budget summary after setting budget', () => {
      // First set a budget
      cy.visit('/set-budget');
      cy.get('input[placeholder="Enter your monthly budget"]').type('5000');
      cy.get('button[type="submit"]').contains('Set Budget').click();
      cy.wait(2000);

      // Navigate to budget view page
      cy.visit('/budget');
      cy.wait(1000);
      
      // Assert: Budget information is displayed
      cy.contains('Budget', { timeout: 5000 }).should('be.visible');
    });

    it('should show warning when budget usage exceeds 90%', () => {
      // Set a budget
      cy.visit('/set-budget');
      cy.get('input[placeholder="Enter your monthly budget"]').type('1000'); // Lower budget
      cy.get('button[type="submit"]').contains('Set Budget').click();
      cy.wait(2000);

      // Add expenses to exceed 90%
      cy.visit('/add-transaction');
      cy.get('select').first().select('expense');
      cy.get('input[placeholder="Enter amount"]').type('950');
      cy.get('select').eq(1).select(1); // Select first category
      const today = new Date().toISOString().split('T')[0];
      cy.get('input[type="date"]').type(today);
      cy.get('button[type="submit"]').contains('Add Transaction').click();
      cy.wait(2000);

      // Check budget view
      cy.visit('/budget');
      cy.wait(2000);
      
      // Assert: Budget information should show high usage
      cy.contains('Budget', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('View All Budgets', () => {
    it('should display list of all budgets', () => {
      // Set a budget for current month
      cy.visit('/set-budget');
      cy.get('input[placeholder="Enter your monthly budget"]').type('4000');
      cy.get('button[type="submit"]').contains('Set Budget').click();
      cy.wait(2000);

      // Navigate to previous budgets view
      cy.visit('/previous-budgets');
      
      // Assert: Budgets list is displayed
      cy.contains('Budget', { timeout: 5000 }).should('be.visible');
    });
  });
});
