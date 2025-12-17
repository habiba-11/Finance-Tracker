// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to login a user
 * @example cy.login('user@example.com', 'password123')
 */
Cypress.Commands.add('login', (email, password) => {
  // Check if already logged in by checking localStorage
  cy.window().then((win) => {
    const userId = win.localStorage.getItem('userId');
    if (userId) {
      // Already logged in, just visit a protected page to ensure we're authenticated
      cy.visit('/dashboard');
      cy.url({ timeout: 5000 }).should((url) => {
        expect(url).to.not.include('/login');
      });
      return;
    }
  });

  // Not logged in, proceed with login
  cy.visit('/login');
  cy.get('input[placeholder="Enter your email"]').clear().type(email);
  cy.get('input[placeholder="Enter your password"]').clear().type(password);
  cy.get('button[type="submit"]').contains('Login').click();
  // Wait for navigation away from login page
  // After login, user can be redirected to /dashboard or /set-budget
  // Login page does async budget check before navigating, so we need longer timeout
  cy.url({ timeout: 15000 }).should((url) => {
    expect(url).to.not.include('/login');
    expect(url).to.not.include('/register');
  });
});

/**
 * Custom command to register a new user
 * @example cy.register('Test User', 'user@example.com', 'password123')
 */
Cypress.Commands.add('register', (name, email, password) => {
  cy.visit('/register');
  cy.get('input[placeholder="Enter your full name"]').type(name);
  cy.get('input[placeholder="Enter your email"]').type(email);
  cy.get('input[placeholder="Enter your password"]').first().type(password);
  cy.get('input[placeholder="Confirm your password"]').type(password);
  cy.get('button[type="submit"]').contains('Register').click();
  // Wait a bit for registration to complete
  cy.wait(2000);
});
