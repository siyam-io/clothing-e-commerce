# Authentication Module (`src/modules/auth`)

## Overview

The authentication module manages user identity lifecycle, credential verification, session token issuance, password recovery, and third-party OAuth integrations (Google, Facebook).

## Architecture

The module adheres to a three-tier layered architecture with dependency inversion:

```
+-------------------------------------------------------------+
| Presentation Layer: auth.controller.js & auth.routes.js     |
| - Express route bindings, rate limits, schema validation     |
| - Translates HTTP input and returns HTTP responses          |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Application / Domain Layer: auth.service.js                 |
| - Pure business logic and domain workflows                  |
| - Password hashing, token minting, enumeration defense      |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Data Access Layer: auth.repository.js                       |
| - Mongoose schema queries for User, Role, Order, ApiKey     |
+-------------------------------------------------------------+
```

### Components

1. **`auth.validation.js`**: Zod validation schemas validating request bodies before reaching controller logic.
2. **`auth.repository.js`**: Database abstraction wrapping Mongoose model queries. Allows passing mock models for unit testing without database connectivity.
3. **`auth.service.js`**: Orchestration service handling registration, login, verification, password reset, and federated OAuth flows. Throws typed `ApiError` instances.
4. **`auth.controller.js`**: Thin Express handlers wrapped with `asyncHandler`. Each function translates incoming requests to service calls in under 15 lines of code.
5. **`auth.routes.js`**: Express router mounting rate limiters, validation middleware, and controller actions.

## Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Register a new customer account |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate email/password credentials |
| `POST` | `/api/auth/google-login` | Public (Rate Limited) | Authenticate using Google OAuth ID/Access Token |
| `POST` | `/api/auth/facebook-login` | Public (Rate Limited) | Authenticate using Facebook Access Token |
| `GET` | `/api/auth/verify-email` | Public | Verify user account from email confirmation link |
| `POST` | `/api/auth/forgot-password` | Public (Rate Limited) | Dispatch timing-safe password reset link |
| `POST` | `/api/auth/reset-password` | Public (Rate Limited) | Update password using single-use reset token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve profile for authenticated user |

## Testing

Unit tests for `AuthService` are located in `src/modules/auth/__tests__/auth.service.test.js`.

Execute the test suite from the `backend/` directory:

```bash
npm test
```

