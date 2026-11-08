// Custom Cypress commands for Vanguard E-Commerce

/**
 * Custom command to mock admin authentication session & network responses
 */
Cypress.Commands.add("loginAsAdmin", () => {
  const adminRole = {
    name: "superadmin",
    permissions: ["all"],
  };

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      id: "admin123",
      email: "admin@vanguard.test",
      role: adminRole,
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    })
  );
  const mockToken = `${header}.${payload}.mockSignature12345`;

  // Intercept authentication endpoint so checkSession resolves as authenticated admin
  cy.intercept("GET", "**/api/auth/me", {
    statusCode: 200,
    body: {
      _id: "admin123",
      name: "Super Admin",
      email: "admin@vanguard.test",
      role: adminRole,
      isActive: true,
    },
  }).as("getAdminUser");

  // Intercept admin counts for sidebar
  cy.intercept("GET", "**/api/admin/counts", {
    statusCode: 200,
    body: {
      orders: 12,
      products: 30,
      categories: 8,
      banners: 4,
      flashSales: 2,
      coupons: 5,
      blogs: 3,
      users: 15,
    },
  });

  // Intercept audit logs data endpoint
  cy.intercept("GET", "**/api/admin/audit-logs*", {
    statusCode: 200,
    body: {
      success: true,
      logs: [
        {
          _id: "log123",
          userName: "Super Admin",
          userRole: "superadmin",
          module: "ORDER",
          action: "STATUS_CHANGE",
          description: "Updated order ORD-1001 status to processing",
          status: "SUCCESS",
          ipAddress: "127.0.0.1",
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      },
    },
  }).as("getAuditLogs");

  // Intercept audit logs stats endpoint
  cy.intercept("GET", "**/api/admin/audit-logs/stats", {
    statusCode: 200,
    body: {
      success: true,
      stats: {
        totalLogs: 1,
        todayLogs: 1,
        failureLogs: 0,
        topModules: [{ _id: "ORDER", count: 1 }],
        topActions: [{ _id: "STATUS_CHANGE", count: 1 }],
      },
    },
  }).as("getAuditStats");

  // Set the authentication cookies required by Next.js middleware
  cy.setCookie("vanguard_auth_token", mockToken);
  cy.setCookie("token", mockToken);
});
