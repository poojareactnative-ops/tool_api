const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tools API',
      version: '1.0.0',
      description: 'A comprehensive API for managing tools, users, problems, and solutions',
      contact: {
        name: 'API Support',
        email: 'support@toolsapi.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development Server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            password: { type: 'string', example: 'password123' },
            bio: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            experience: { type: 'integer', example: 5 },
            wallet_coins: { type: 'number', example: 100 },
            wallet_money: { type: 'number', example: 500 },
            rating: { type: 'number', example: 4.5 },
            profile_pic: { type: 'string' }
          }
        },
        Tool: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Hammer' },
            description: { type: 'string', example: 'A sturdy hammer for nails' },
            price: { type: 'number', example: 29.99 },
            photo: { type: 'string', example: 'photo_url' },
            quantity: { type: 'integer', example: 5 },
            status: { type: 'string', enum: ['available', 'pending_exchange', 'sold'] },
            owner_id: { type: 'integer', example: 1 },
            buyer_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            tool_id: { type: 'integer' },
            quantity: { type: 'integer', example: 1 },
            added_at: { type: 'string', format: 'date-time' }
          }
        },
        Problem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string', example: 'Database optimization' },
            description: { type: 'string' },
            created_by: { type: 'integer' },
            reward_type: { type: 'string', enum: ['money', 'coins'] },
            reward_amount: { type: 'number', example: 500 },
            status: { type: 'string', enum: ['open', 'in-progress', 'completed', 'paid', 'closed'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Solution: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            problem_id: { type: 'integer' },
            solver_id: { type: 'integer' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['submitted', 'selected', 'rejected', 'paid'] },
            submitted_at: { type: 'string', format: 'date-time' }
          }
        },
        ExchangeRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            tool_offered_id: { type: 'integer' },
            tool_requested_id: { type: 'integer' },
            requester_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            message: { type: 'string' },
            type: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
