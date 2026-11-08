import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Backend API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Clothing E-Commerce Backend System.',
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.route.js', './src/app.js'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
