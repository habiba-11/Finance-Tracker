// Authentication E2E Tests
// Testing user registration and login flows

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Note: In a real scenario, you might want to clear the database
    // For now, we'll use unique emails for each test run
    const timestamp = Date.now();
    cy.wrap(timestamp).as('timestamp');
  });

  describe('User Registration', () => {
    it('should successfully register a new user', () => {
      cy.get('@timestamp').then((timestamp) => {
        const email = `testuser${timestamp}@example.com`;
        
        cy.visit('/register');
        
        // Fill registration form
        cy.get('input[placeholder="Enter your full name"]').type('Test User');
        cy.get('input[placeholder="Enter your email"]').type(email);
        cy.get('input[placeholder="Enter your password"]').first().type('password123');
        cy.get('input[placeholder="Confirm your password"]').type('password123');
        
        // Submit form
        cy.get('button[type="submit"]').contains('Register').click();
        
        // Assert: Success message appears or redirects to login
        cy.contains('Registration successful', { timeout: 5000 }).should('be.visible');
      });
    });

    it('should display error message for duplicate email', () => {
      // First, register a user
      cy.get('@timestamp').then((timestamp) => {
        const email = `duplicate${timestamp}@example.com`;
        
        cy.visit('/register');
        cy.get('input[placeholder="Enter your full name"]').type('First User');
        cy.get('input[placeholder="Enter your email"]').type(email);
        cy.get('input[placeholder="Enter your password"]').first().type('password123');
        cy.get('input[placeholder="Confirm your password"]').type('password123');
        cy.get('button[type="submit"]').contains('Register').click();
        cy.wait(2000);

        // Try to register again with same email
        cy.visit('/register');
        cy.get('input[placeholder="Enter your full name"]').type('Second User');
        cy.get('input[placeholder="Enter your email"]').type(email);
        cy.get('input[placeholder="Enter your password"]').first().type('password123');
        cy.get('input[placeholder="Confirm your password"]').type('password123');
        cy.get('button[type="submit"]').contains('Register').click();
        
        // Assert: Error message appears
        cy.contains('Email already exists', { timeout: 5000 }).should('be.visible');
      });
    });

    it('should validate required fields', () => {
      cy.visit('/register');
      
      // Try to submit without filling fields
      cy.get('button[type="submit"]').contains('Register').click();
      
      // Assert: Validation errors appear
      cy.contains('Name must be at least 2 characters', { timeout: 2000 }).should('be.visible');
      cy.contains('Email is required', { timeout: 2000 }).should('be.visible');
      cy.contains('Password is required', { timeout: 2000 }).should('be.visible');
      
      // Form should still be visible (not redirected)
      cy.url().should('include', '/register');
    });
  });

  describe('User Login', () => {
    it('should successfully login with valid credentials', () => {
      // First register a user
      cy.get('@timestamp').then((timestamp) => {
        const email = `loginuser${timestamp}@example.com`;
        
        // Register
        cy.visit('/register');
        cy.get('input[placeholder="Enter your full name"]').type('Login Test User');
        cy.get('input[placeholder="Enter your email"]').type(email);
        cy.get('input[placeholder="Enter your password"]').first().type('password123');
        cy.get('input[placeholder="Confirm your password"]').type('password123');
        cy.get('button[type="submit"]').contains('Register').click();
        cy.wait(2000);

        // Now login
        cy.visit('/login');
        cy.get('input[placeholder="Enter your email"]').type(email);
        cy.get('input[placeholder="Enter your password"]').type('password123');
        cy.get('button[type="submit"]').contains('Login').click();
        
        // Assert: Success message or redirect to dashboard/set-budget
        cy.url({ timeout: 5000 }).should('match', /\/(dashboard|set-budget)/);
      });
    });

    it('should display error message for invalid credentials', () => {
      cy.visit('/login');
      
      // Try to login with wrong credentials
      cy.get('input[placeholder="Enter your email"]').type('nonexistent@example.com');
      cy.get('input[placeholder="Enter your password"]').type('wrongpassword');
      cy.get('button[type="submit"]').contains('Login').click();
      
      // Assert: Error message appears
      cy.contains('Invalid credentials', { timeout: 5000 }).should('be.visible');
      
      // Assert: Stay on login page
      cy.url().should('include', '/login');
    });

    it('should validate login form fields', () => {
      cy.visit('/login');
      
      // Check that form fields are present
      cy.get('input[placeholder="Enter your email"]').should('be.visible');
      cy.get('input[placeholder="Enter your password"]').should('be.visible');
      cy.get('button[type="submit"]').contains('Login').should('be.visible');
    });
  });
});
