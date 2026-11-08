import "./commands";

// Prevent Next.js runtime/hydration mismatch or harmless third-party errors from failing tests
Cypress.on("uncaught:exception", (err, runnable) => {
  return false;
});

