# Backend Service

## Architecture Overview

This backend is built on Node.js and Express, connected to MongoDB via Mongoose and Redis for caching and rate limiting. It follows a domain-driven, layered architecture separating Presentation, Application, Domain, and Data Access concerns.

```
backend/
├── src/
│   ├── app.js               # Express application initialization and middleware chain
│   ├── server.js            # HTTP and Socket.io server bootstrap and lifecycle
│   ├── swagger.js           # OpenAPI / Swagger configuration
│   ├── config/              # Redis and third-party client configurations
│   ├── middleware/          # Security, auth, rate limiting, and error handling
│   ├── modules/             # Domain modules (auth, user, product, order, chat, etc.)
│   ├── services/            # Cross-cutting services (email, image upload, payments, logistics)
│   └── utils/               # Encryption, logger, pagination, response helpers
└── src/**/__tests__/        # Automated unit and integration test suites
```

## Layering Conventions

- **Presentation (`*.routes.js`, `*.controller.js`)**: Handles HTTP routing, input validation via Zod schemas, rate limiting, and response serialization. Controllers remain thin (< 20 lines per handler) and delegate logic to domain services.
- **Application & Domain (`*.service.js`)**: Encapsulates business rules, credential checks, token lifecycles, and transaction logic. Operates without direct coupling to Express request/response objects.
- **Data Access (`*.repository.js`, `*.model.js`)**: Wraps Mongoose models to allow dependency injection and deterministic unit testing with mock data layers.

## Core Services

| Service | Location | Responsibilities |
| :--- | :--- | :--- |
| `AuthService` | `src/modules/auth/auth.service.js` | User registration, login, token generation, password recovery, federated OAuth |
| `EmailService` | `src/services/email.service.js` | Transactional email dispatches (verification, resets, invoice receipts, order updates) with 60s config caching |
| `BkashService` | `src/services/bkash.service.js` | Tokenized bKash payment gateway integration with in-memory token TTL caching and timeout protection |
| `PathaoService` | `src/services/pathao.service.js` | Pathao Courier logistics integration with Redis token caching, address auto-resolution, and consignment creation |
| `ConversationalOrderService` | `src/modules/chat/services/conversationalOrder.service.js` | Maps multimodal VLM intents to cart mutations, stock checks, and checkout order drafts |
| `VectorSearchService` | `src/modules/chat/services/vectorSearch.service.js` | Cosine similarity semantic search over MongoDB Atlas vector embeddings |

## Development & Testing

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis (optional for development; falls back to in-memory rate limiting and no-op caching)

### Commands

```bash
# Install dependencies
npm install

# Run test suite
npm test

# Run tests with coverage
npm run test:coverage

# Start development server with reload
npm run dev

# Start production server
npm start
```

## Security Standards

- **Authentication**: JWT tokens signed using HS256 with 7-day expiration.
- **Password Storage**: Salting and hashing via bcrypt with a cost factor of 10.
- **Payload Encryption**: AES-256-GCM authenticated encryption with 96-bit initialization vectors and 128-bit authentication tags.
- **Timing and Enumeration Defense**: Generic responses on password recovery endpoints to prevent user account enumeration.
- **Input Validation**: Strict Zod schema parsing on incoming request bodies before reaching controller logic.
- **HTTP Protection**: Helmet security headers, content security policy, strict CORS origin checks, and IP-keyed rate limiters.
