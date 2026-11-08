describe("Storefront & Navigation E2E Tests", () => {
  it("loads the homepage with brand header and navigation elements", () => {
    cy.visit("/");
    cy.get("body").should("be.visible");
    cy.title().should("exist");
    cy.get("nav, header").should("exist");
  });

  it("navigates to the products page", () => {
    cy.visit("/products");
    cy.url().should("include", "/products");
    cy.get("body").should("be.visible");
  });

  it("renders correctly on mobile device viewport", () => {
    cy.viewport("iphone-x");
    cy.visit("/");
    cy.get("body").should("be.visible");
  });

  it("verifies public blog page loads", () => {
    cy.visit("/blog");
    cy.url().should("include", "/blog");
    cy.get("body").should("be.visible");
  });
});
