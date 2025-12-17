// Complete User Journey E2E Test
// Testing full workflow from registration to budget tracking

describe('Complete User Journey', () => {
  let testEmail;

  it('should complete full user workflow: Register → Login → Set Budget → Add Transactions → View Dashboard', () => {
    // Step 1: Register a new user
    const timestamp = Date.now();
    testEmail = `journeyuser${timestamp}@example.com`;
    
    cy.register('Journey Test User', testEmail, 'password123');
    cy.wait(2000);

    // Step 2: Login
    cy.login(testEmail, 'password123');
    cy.wait(2000);

    // Step 3: Set Monthly Budget
    cy.visit('/set-budget');
    cy.get('input[placeholder="Enter your monthly budget"]').type('5000');
    cy.get('button[type="submit"]').contains('Set Budget').click();
    cy.contains('Budget set successfully', { timeout: 5000 }).should('be.visible');
    cy.wait(2000);

    // Step 4: Add Income Transactions
    cy.visit('/add-transaction');
    const today = new Date().toISOString().split('T')[0];
    
    // Add first income
    cy.get('select').first().select('income');
    cy.get('input[placeholder="Enter amount"]').type('3000');
    cy.get('input[type="date"]').type(today);
    cy.get('button[type="submit"]').contains('Add Transaction').click();
    cy.contains('Transaction added successfully', { timeout: 5000 }).should('be.visible');
    cy.wait(2000);

    // Add second income
    cy.visit('/add-transaction');
    cy.get('select').first().select('income');
    cy.get('input[placeholder="Enter amount"]').type('1000');
    cy.get('input[type="date"]').type(today);
    cy.get('button[type="submit"]').contains('Add Transaction').click();
    cy.contains('Transaction added successfully', { timeout: 5000 }).should('be.visible');
    cy.wait(2000);

    // Step 5: Add Expense Transactions
    cy.visit('/add-transaction');
    
    // Add first expense
    cy.get('select').first().select('expense');
    cy.get('input[placeholder="Enter amount"]').type('500');
    cy.get('select').eq(1).select(1); // Select first category
    cy.get('input[type="date"]').type(today);
    cy.get('textarea[placeholder="Add a description"]').type('Groceries');
    cy.get('button[type="submit"]').contains('Add Transaction').click();
    cy.contains('Transaction added successfully', { timeout: 5000 }).should('be.visible');
    cy.wait(2000);

    // Add second expense
    cy.visit('/add-transaction');
    cy.get('select').first().select('expense');
    cy.get('input[placeholder="Enter amount"]').type('300');
    cy.get('select').eq(1).select(1); // Select first category
    cy.get('input[type="date"]').type(today);
    cy.get('button[type="submit"]').contains('Add Transaction').click();
    cy.contains('Transaction added successfully', { timeout: 5000 }).should('be.visible');
    cy.wait(2000);

    // Step 6: View Dashboard
    cy.visit('/dashboard');
    cy.url({ timeout: 5000 }).should('include', '/dashboard');
    cy.contains('Dashboard', { timeout: 5000 }).should('be.visible');

    // Step 7: View Transactions List
    cy.visit('/transactions');
    cy.url({ timeout: 5000 }).should('include', '/transactions');
    cy.contains('Transaction', { timeout: 5000 }).should('be.visible');

    // Step 8: View Budget Status
    cy.visit('/budget');
    cy.url({ timeout: 5000 }).should('include', '/budget');
    cy.contains('Budget', { timeout: 5000 }).should('be.visible');
  });
});
