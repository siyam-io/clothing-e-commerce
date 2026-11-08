describe("User Authentication & Login Flow E2E Tests", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    // Ensure clean unauthenticated session
    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 401,
      body: { message: "Unauthenticated" },
    });
    cy.visit("/login");
  });

  it("renders the login portal with input fields and submit button", () => {
    cy.get("body").should("be.visible");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
    cy.get('button[type="submit"]').should("exist");
  });

  it("allows entering credentials in email and password fields", () => {
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="email"]').type("customer@example.com");
    cy.get('input[name="email"]').should("have.value", "customer@example.com");

    cy.get('input[name="password"]').should("be.visible");
    cy.get('input[name="password"]').type("SecretPassword123");
    cy.get('input[name="password"]').should("have.value", "SecretPassword123");
  });
});
