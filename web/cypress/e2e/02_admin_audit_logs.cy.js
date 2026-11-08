describe("Admin Panel & Audit Logs E2E Tests", () => {
  it("protects admin routes by redirecting unauthenticated visitors to login", () => {
    cy.visit("/admin/audit-logs");
    cy.url().should("include", "/login");
  });

  it("loads the Audit Logs management screen for authenticated admins", () => {
    cy.loginAsAdmin();
    cy.visit("/admin/audit-logs");
    cy.url().should("include", "/admin/audit-logs");
    cy.get("body").should("be.visible");
    cy.contains("Audit Logs").should("exist");
  });

  it("displays search bar and module/action filters on Audit Logs page", () => {
    cy.loginAsAdmin();
    cy.visit("/admin/audit-logs");

    // Search input verification
    cy.get('input[placeholder*="Search"]').should("exist");

    // Module / Action / Status select dropdowns verification
    cy.get("select").should("have.length.at.least", 2);
  });
});
