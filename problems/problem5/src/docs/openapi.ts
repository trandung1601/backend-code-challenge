/**
 * OpenAPI 3.0 specification for the Book CRUD API.
 * Served as interactive docs via swagger-ui-express at /docs.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Book CRUD API',
    version: '1.0.0',
    description:
      'A simple CRUD API to manage Books. Built with Express + TypeScript, ' +
      'persisted in SQLite via Prisma, validated with Zod.',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local server' }],
  tags: [{ name: 'Books', description: 'Book management endpoints' }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number', example: 12.34 },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/books': {
      get: {
        tags: ['Books'],
        summary: 'List books with filters, pagination and sorting',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Match title OR author (case-insensitive)' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Exact category match' },
          { name: 'currency', in: 'query', schema: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'INR', 'VND'] }, description: 'Exact currency match (ISO 4217)' },
          { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 }, description: 'Price >= value' },
          { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 }, description: 'Price <= value' },
          { name: 'isAvailable', in: 'query', schema: { type: 'boolean' }, description: 'Availability filter' },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['price', 'stock', 'title', 'createdAt'], default: 'createdAt' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of books',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Book' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
      post: {
        tags: ['Books'],
        summary: 'Create a book',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/CreateBookMultipart' },
            },
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBook' },
              example: {
                title: 'Refactoring',
                author: 'Martin Fowler',
                price: 40,
                currency: 'USD',
                stock: 8,
                category: 'Programming',
                imageBase64: 'iVBORw0KGgo...',
                imageMimeType: 'image/png',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Book created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/books/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      get: {
        tags: ['Books'],
        summary: 'Get a book by id',
        responses: {
          '200': { description: 'The book', content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } } },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Books'],
        summary: 'Update a book (partial)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/UpdateBookMultipart' },
            },
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateBook' },
              example: { price: 99.5, stock: 3, imageBase64: 'iVBORw0KGgo...', imageMimeType: 'image/png' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated book', content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Books'],
        summary: 'Delete a book',
        responses: {
          '204': { description: 'Book deleted (no content)' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  components: {
    schemas: {
      Book: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Clean Code' },
          author: { type: 'string', example: 'Robert C. Martin' },
          price: { type: 'number', example: 32.5 },
          currency: { type: 'string', example: 'USD' },
          stock: { type: 'integer', example: 12 },
          category: { type: 'string', example: 'Programming' },
          imageUrl: { type: 'string', nullable: true, example: '/uploads/books/cover.png' },
          isAvailable: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateBook: {
        type: 'object',
        required: ['title', 'author', 'price', 'stock', 'category'],
        properties: {
          title: { type: 'string', minLength: 1, example: 'Refactoring' },
          author: { type: 'string', minLength: 1, example: 'Martin Fowler' },
          price: { type: 'number', minimum: 0, example: 40 },
          currency: {
            type: 'string',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'INR', 'VND'],
            default: 'USD',
            description: 'ISO 4217 currency code for the price. Defaults to USD.',
            example: 'USD',
          },
          stock: { type: 'integer', minimum: 0, example: 8 },
          category: { type: 'string', minLength: 1, example: 'Programming' },
          imageUrl: { type: 'string', format: 'uri', example: 'https://example.com/images/refactoring.jpg' },
          imageBase64: {
            type: 'string',
            description: 'Optional base64 image payload. Can be raw base64 or a data URL.',
            example: 'iVBORw0KGgo...',
          },
          imageMimeType: {
            type: 'string',
            enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            description: 'Required when imageBase64 is raw base64.',
            example: 'image/png',
          },
          isAvailable: { type: 'boolean', default: true },
        },
      },
      CreateBookMultipart: {
        type: 'object',
        required: ['title', 'author', 'price', 'stock', 'category'],
        properties: {
          title: { type: 'string', minLength: 1, example: 'Refactoring' },
          author: { type: 'string', minLength: 1, example: 'Martin Fowler' },
          price: { type: 'number', minimum: 0, example: 40 },
          currency: {
            type: 'string',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'INR', 'VND'],
            default: 'USD',
            description: 'ISO 4217 currency code for the price. Defaults to USD.',
            example: 'USD',
          },
          stock: { type: 'integer', minimum: 0, example: 8 },
          category: { type: 'string', minLength: 1, example: 'Programming' },
          image: {
            type: 'string',
            format: 'binary',
            description: 'Optional book cover image. Supported: jpeg, png, webp, gif. Max 2MB.',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'Optional external image URL when not uploading a file.',
          },
          isAvailable: { type: 'boolean', default: true },
        },
      },
      UpdateBook: {
        type: 'object',
        description: 'Any subset of the create fields (at least one required).',
        properties: {
          title: { type: 'string', minLength: 1 },
          author: { type: 'string', minLength: 1 },
          price: { type: 'number', minimum: 0 },
          currency: {
            type: 'string',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'INR', 'VND'],
            description: 'ISO 4217 currency code for the price.',
          },
          stock: { type: 'integer', minimum: 0 },
          category: { type: 'string', minLength: 1 },
          imageUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            description: 'New external image URL, or null to remove the current image.',
          },
          imageBase64: {
            type: 'string',
            description: 'Optional replacement image payload. Can be raw base64 or a data URL.',
          },
          imageMimeType: {
            type: 'string',
            enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            description: 'Required when imageBase64 is raw base64.',
          },
          isAvailable: { type: 'boolean' },
        },
      },
      UpdateBookMultipart: {
        type: 'object',
        description: 'Any subset of the create fields (at least one required).',
        properties: {
          title: { type: 'string', minLength: 1 },
          author: { type: 'string', minLength: 1 },
          price: { type: 'number', minimum: 0 },
          currency: {
            type: 'string',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'INR', 'VND'],
            description: 'ISO 4217 currency code for the price.',
          },
          stock: { type: 'integer', minimum: 0 },
          category: { type: 'string', minLength: 1 },
          image: {
            type: 'string',
            format: 'binary',
            description: 'Optional replacement book cover image. Supported: jpeg, png, webp, gif. Max 2MB.',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'Optional external image URL when not uploading a file.',
          },
          isAvailable: { type: 'boolean' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      ValidationErrorBody: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'price' },
                message: { type: 'string', example: 'price must be >= 0' },
              },
            },
          },
        },
      },
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Book with id 999 not found' } } },
      },
      ValidationError: {
        description: 'Invalid request data',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorBody' } } },
      },
    },
  },
} as const;
