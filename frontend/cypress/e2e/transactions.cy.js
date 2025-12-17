// Transaction E2E Tests
// Testing transaction creation and viewing flows

describe('Transaction Management Flow', () => {
  let testUserId;
  let testEmail;

  before(() => {
    // Register a user before all tests
    const timestamp = Date.now();
    testEmail = `transactionuser${timestamp}@example.com`;
    
    cy.register('Transaction Test User', testEmail, 'password123');
    
    // Login to get userId
    cy.login(testEmail, 'password123');
    cy.wait(1000);
  });

  beforeEach(function() {
    // Skip login for tests that explicitly clear localStorage
    // (We'll check test title to determine this)
    const testTitle = this.currentTest?.title || '';
    if (testTitle.includes('require userId') || testTitle.includes('not logged in')) {
      return;
    }
    // Login before each test
    cy.login(testEmail, 'password123');
    cy.wait(1000);
  });

  describe('Add Income Transaction', () => {
    it('should successfully add an income transaction', () => {
      // Navigate to add transaction page
      cy.visit('/add-transaction');
      
      // Fill transaction form
      cy.get('select').first().select('income');
      cy.get('input[placeholder="Enter amount"]').type('1000');
      
      // Set date (format: YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      cy.get('input[type="date"]').type(today);
      
      // Submit
      cy.get('button[type="submit"]').contains('Add Transaction').click();
      
      // Assert: Success message appears (toast notification)
      cy.contains('Transaction added successfully', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Add Expense Transaction', () => {
    it('should successfully add an expense transaction', () => {
      cy.visit('/add-transaction');
      
      // Fill expense transaction form
      cy.get('select').first().select('expense');
      cy.get('input[placeholder="Enter amount"]').type('50');
      
      // Select category from dropdown
      cy.get('select').eq(1).select(1); // Select first category option (skip empty option)
      
      const today = new Date().toISOString().split('T')[0];
      cy.get('input[type="date"]').type(today);
      
      // Optional description for expense
      cy.get('textarea[placeholder="Add a description"]').type('Lunch');
      
      // Submit
      cy.get('button[type="submit"]').contains('Add Transaction').click();
      
      // Assert: Success message
      cy.contains('Transaction added successfully', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('View Transactions', () => {
    it('should display transactions list with summary', () => {
      // First add a transaction
      cy.visit('/add-transaction');
      cy.get('select').first().select('income');
      cy.get('input[placeholder="Enter amount"]').type('200');
      const today = new Date().toISOString().split('T')[0];
      cy.get('input[type="date"]').type(today);
      cy.get('button[type="submit"]').contains('Add Transaction').click();
      cy.wait(2000);

      // Navigate to transactions view
      cy.visit('/transactions');
      
      // Assert: Transactions page loads
      cy.url().should('include', '/transactions');
      
      // Assert: Transactions are displayed (at least headers or summary)
      cy.contains('Transaction', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Transaction Validation', () => {
    it('should require userId to add transaction', () => {
      // Clear localStorage to simulate not being logged in
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      // Try to access add transaction without being logged in
      cy.visit('/add-transaction');
      
      // Should redirect to login page due to ProtectedRoute
      cy.url({ timeout: 3000 }).should('include', '/login');
    });
  });
});
