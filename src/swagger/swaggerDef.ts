import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BibleLib API',
      version: '1.0.0',
      description: `
The BibleLib backend API. Each bible is stored as its own self-contained
record made up of four pieces — **info**, **books**, **chapters**, and
**verses** — file layout used to seed bibles.

### BibleId
You never choose a bibleId yourself. When you create a bible, BibleLib
generates one for you based on the
name, abbreviation, and language you submit. Use the returned \`id\` for
every subsequent books/chapters/verses request for that bible.

### Authentication
Write operations (POST, PUT, DELETE) require an API key in the request header:
\`\`\`
x-api-key: your-secret-key
\`\`\`
GET requests are public and do not require a key.

### Bulk operations
POST and PUT on /books, /chapters and /verses accept either a single
object (for one record) or an array (for bulk create/update) — exactly
like the SongLib v2 API.

### Rate Limits
| Tier | Limit | Window |
|------|-------|--------|
| Read (GET) | 300 requests | 15 min |
| Write (POST/PUT/DELETE) | 60 requests | 15 min |
| Bulk operations | 10 requests | 15 min |
      `,
      contact: {
        name: '@SiroDevs',
        url: 'https://sirodevs.vercel.app',
      },
    },
    servers: [
      {
        url: 'https://biblelib.vercel.app/api/v1',
        description: 'Production',
      },
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Required for all write operations (POST, PUT, DELETE)',
        },
      },
      schemas: {
        Language: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', example: 'eng', description: 'ISO 639-3 language code' },
            name: { type: 'string', example: 'English' },
            nameLocal: { type: 'string', example: 'English' },
            script: { type: 'string', example: 'Latin' },
            scriptDirection: { type: 'string', example: 'LTR', enum: ['LTR', 'RTL'] },
          },
        },

        Country: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', example: 'US' },
            name: { type: 'string', example: 'United States of America' },
            nameLocal: { type: 'string', example: 'United States of America' },
          },
        },

        Bible: {
          type: 'object',
          required: ['name', 'abbreviation', 'language'],
          properties: {
            id: { type: 'string', example: '78a9f6124f344018-01', description: 'Auto-generated bibleId — read only' },
            dblId: { type: 'string', example: '78a9f6124f344018' },
            relatedDbl: { type: 'string', nullable: true, example: null },
            name: { type: 'string', example: 'New International Version 2011' },
            nameLocal: { type: 'string', example: 'New International Version' },
            abbreviation: { type: 'string', example: 'NIV11' },
            abbreviationLocal: { type: 'string', example: 'NIV' },
            description: { type: 'string', example: 'Holy Bible' },
            descriptionLocal: { type: 'string', example: 'Holy Bible' },
            language: { $ref: '#/components/schemas/Language' },
            countries: { type: 'array', items: { $ref: '#/components/schemas/Country' } },
            type: { type: 'string', example: 'text' },
            copyright: { type: 'string', example: 'The Holy Bible, New International Version® NIV®...' },
            info: { type: 'string', example: '<h3>About Biblica</h3> <p>...</p>' },
            audioBibles: { type: 'array', items: {} },
            created: { type: 'string', format: 'date-time' },
            updated: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Book: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', example: 'GEN', description: 'Canonical book code' },
            bibleId: { type: 'string', example: '78a9f6124f344018-01', description: 'Auto-injected from the URL — read only' },
            abbreviation: { type: 'string', example: 'Ge' },
            name: { type: 'string', example: 'Gen.' },
            nameLong: { type: 'string', example: 'Genesis' },
            created: { type: 'string', format: 'date-time' },
            updated: { type: 'string', format: 'date-time' },
          },
        },

        Chapter: {
          type: 'object',
          required: ['id', 'bookId', 'number'],
          properties: {
            id: { type: 'string', example: 'GEN.1' },
            bibleId: { type: 'string', example: '78a9f6124f344018-01', description: 'Auto-injected from the URL — read only' },
            bookId: { type: 'string', example: 'GEN' },
            number: { type: 'string', example: '1' },
            reference: { type: 'string', example: 'Gen. 1' },
            created: { type: 'string', format: 'date-time' },
            updated: { type: 'string', format: 'date-time' },
          },
        },

        Verse: {
          type: 'object',
          required: ['id', 'bookId', 'number'],
          properties: {
            id: { type: 'string', example: 'GEN.1', description: 'Chapter id this verse content belongs to' },
            bibleId: { type: 'string', example: '78a9f6124f344018-01', description: 'Auto-injected from the URL — read only' },
            bookId: { type: 'string', example: 'GEN' },
            number: { type: 'string', example: '1' },
            reference: { type: 'string', example: 'Gen. 1' },
            copyright: { type: 'string', example: 'The Holy Bible, New International Version® NIV®...' },
            verseCount: { type: 'integer', example: 31 },
            content: {
              type: 'array',
              description: 'USX-like content tree (paragraphs, verse markers, and text items)',
              items: { type: 'object' },
            },
            created: { type: 'string', format: 'date-time' },
            updated: { type: 'string', format: 'date-time' },
          },
        },

        BibleExport: {
          type: 'object',
          description: 'Full bible bundle shaped exactly like the four bible-*.json source files.',
          properties: {
            'bible-info': { type: 'object', properties: { data: { $ref: '#/components/schemas/Bible' } } },
            'bible-books': { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Book' } } } },
            'bible-chapters': { type: 'object', additionalProperties: { type: 'array', items: { $ref: '#/components/schemas/Chapter' } }, example: { GEN: [{ id: 'GEN.1', bookId: 'GEN', number: '1', reference: 'Gen. 1' }] } },
            'bible-verses': { type: 'object', additionalProperties: { type: 'object', additionalProperties: { $ref: '#/components/schemas/Verse' } }, example: { GEN: { 'GEN.1': { id: 'GEN.1', bookId: 'GEN', number: '1' } } } },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 400 },
            error: { type: 'string', example: 'name is required' },
            details: { type: 'string', example: 'Additional context if available' },
          },
        },

        BulkResult: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 201 },
            message: { type: 'string', example: '50 books processed successfully' },
            count: { type: 'integer', example: 50 },
            results: { type: 'array', items: {} },
            errors: { type: 'array', items: {}, description: 'Only present when some items failed' },
          },
        },
      },

      responses: {
        Unauthorized: {
          description: 'Missing or invalid API key',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        BadRequest: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Conflict: {
          description: 'Duplicate record',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ServerError: {
          description: 'Internal server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },

    tags: [
      { name: 'Health', description: 'Server and database status' },
      { name: 'Bibles', description: 'Bible info — create, fetch, update, delete, export' },
      { name: 'Books', description: 'Books belonging to a bible' },
      { name: 'Chapters', description: 'Chapters belonging to a book' },
      { name: 'Verses', description: 'Verse content (USX-like tree) for a chapter' },
    ],

    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Server and database status',
          description: 'Returns the live status of the API server and its MongoDB connection. Safe for uptime monitors.',
          responses: {
            200: {
              description: 'Healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer', example: 200 },
                      api: { type: 'string', example: 'v1' },
                      server: { type: 'string', example: 'ok' },
                      database: { type: 'string', example: 'connected', enum: ['connected', 'disconnected', 'connecting', 'disconnecting'] },
                      timestamp: { type: 'string', format: 'date-time' },
                      uptime: { type: 'integer', example: 3600, description: 'Server uptime in seconds' },
                    },
                  },
                },
              },
            },
            503: { description: 'Unhealthy — database not connected' },
          },
        },
      },

      '/bibles': {
        get: {
          tags: ['Bibles'],
          summary: 'Get all bibles',
          responses: {
            200: { description: 'List of bibles', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Bible' } } } } } } },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
        post: {
          tags: ['Bibles'],
          summary: 'Create one or many bibles',
          description: 'Pass a single bible-info object or an array for bulk creation. `id` (bibleId) is auto-generated from name + abbreviation + language and must NOT be supplied.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Bible' },
                    { type: 'array', items: { $ref: '#/components/schemas/Bible' } },
                  ],
                },
                examples: {
                  single: {
                    summary: 'Single bible',
                    value: {
                      name: 'New International Version 2011',
                      nameLocal: 'New International Version',
                      abbreviation: 'NIV11',
                      abbreviationLocal: 'NIV',
                      description: 'Holy Bible',
                      language: { id: 'eng', name: 'English', nameLocal: 'English', script: 'Latin', scriptDirection: 'LTR' },
                      countries: [{ id: 'US', name: 'United States of America' }],
                      type: 'text',
                      copyright: 'The Holy Bible, New International Version® NIV®...',
                    },
                  },
                  bulk: {
                    summary: 'Bulk create',
                    value: [
                      { name: 'King James Version', abbreviation: 'KJV', language: { id: 'eng', name: 'English' } },
                      { name: 'Swahili Bible', abbreviation: 'SWH', language: { id: 'swh', name: 'Swahili' } },
                    ],
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Bible(s) created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
        put: {
          tags: ['Bibles'],
          summary: 'Update one or many bibles',
          description: 'Pass a single bible object (with `id`) or an array for bulk updates. The bibleId itself cannot be changed.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Bible' },
                    { type: 'array', items: { $ref: '#/components/schemas/Bible' } },
                  ],
                },
                examples: {
                  single: { summary: 'Update single', value: { id: '78a9f6124f344018-01', description: 'Updated description' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Bible(s) updated' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/bibles/{bibleId}': {
        get: {
          tags: ['Bibles'],
          summary: 'Get a bible by ID',
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          responses: {
            200: { description: 'Bible found', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Bible' } } } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Bibles'],
          summary: 'Delete a bible',
          description: 'Cascades — also deletes all of this bible\u2019s books, chapters, and verse content.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          responses: {
            200: { description: 'Deleted successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/bibles/{bibleId}/export': {
        get: {
          tags: ['Bibles'],
          summary: 'Export a full bible bundle',
          description: 'Returns info, books, chapters, and verses shaped exactly like the bible-info.json / bible-books.json / bible-chapters.json / bible-verses.json source files.',
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          responses: {
            200: { description: 'Full bible bundle', content: { 'application/json': { schema: { $ref: '#/components/schemas/BibleExport' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/books/{bibleId}': {
        get: {
          tags: ['Books'],
          summary: 'Get all books for a bible',
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          responses: {
            200: { description: 'List of books', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Book' } } } } } } },
            404: { $ref: '#/components/responses/NotFound' },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
        post: {
          tags: ['Books'],
          summary: 'Create one or many books',
          description: 'Pass a single book object or an array for bulk creation. `bibleId` is taken from the URL.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Book' },
                    { type: 'array', items: { $ref: '#/components/schemas/Book' } },
                  ],
                },
                examples: {
                  single: { summary: 'Single book', value: { id: 'GEN', abbreviation: 'Ge', name: 'Gen.', nameLong: 'Genesis' } },
                  bulk: {
                    summary: 'Bulk create',
                    value: [
                      { id: 'GEN', abbreviation: 'Ge', name: 'Gen.', nameLong: 'Genesis' },
                      { id: 'EXO', abbreviation: 'Ex', name: 'Exodus', nameLong: 'Exodus' },
                    ],
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Book(s) created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
        put: {
          tags: ['Books'],
          summary: 'Update one or many books',
          description: 'Pass a single book object (with `id`) or an array for bulk updates.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Book' },
                    { type: 'array', items: { $ref: '#/components/schemas/Book' } },
                  ],
                },
                examples: {
                  single: { summary: 'Update single', value: { id: 'GEN', name: 'Gen.', nameLong: 'Genesis (Updated)' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Book(s) updated' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/books/{bibleId}/{ids}': {
        get: {
          tags: ['Books'],
          summary: 'Get books by IDs',
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'ids', required: true, schema: { type: 'string' }, description: 'Comma-separated book IDs', example: 'GEN,EXO,LEV' },
          ],
          responses: {
            200: { description: 'Matching books', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Book' } } } } } } },
            400: { $ref: '#/components/responses/BadRequest' },
          },
        },
        delete: {
          tags: ['Books'],
          summary: 'Delete a book',
          description: 'Cascades — also deletes the chapters and verse content belonging to this book. The `{ids}` segment takes a single bookId here.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'ids', required: true, schema: { type: 'string' }, description: 'bookId to delete', example: 'GEN' },
          ],
          responses: {
            200: { description: 'Deleted successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/chapters/{bibleId}/{bookId}': {
        get: {
          tags: ['Chapters'],
          summary: 'Get all chapters for a book',
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'bookId', required: true, schema: { type: 'string' }, example: 'GEN' },
          ],
          responses: {
            200: { description: 'List of chapters', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Chapter' } } } } },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },

      '/chapters/{bibleId}/{bookId}/{chapterId}': {
        get: {
          tags: ['Chapters'],
          summary: 'Get a single chapter',
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'bookId', required: true, schema: { type: 'string' }, example: 'GEN' },
            { in: 'path', name: 'chapterId', required: true, schema: { type: 'string' }, example: 'GEN.1' },
          ],
          responses: {
            200: { description: 'Chapter found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Chapter' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/chapters/{bibleId}': {
        post: {
          tags: ['Chapters'],
          summary: 'Create one or many chapters',
          description: 'Pass a single chapter object or an array for bulk creation. `bibleId` is taken from the URL.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Chapter' },
                    { type: 'array', items: { $ref: '#/components/schemas/Chapter' } },
                  ],
                },
                examples: {
                  single: { summary: 'Single chapter', value: { id: 'GEN.1', bookId: 'GEN', number: '1', reference: 'Gen. 1' } },
                  bulk: {
                    summary: 'Bulk create',
                    value: [
                      { id: 'GEN.1', bookId: 'GEN', number: '1', reference: 'Gen. 1' },
                      { id: 'GEN.2', bookId: 'GEN', number: '2', reference: 'Gen. 2' },
                    ],
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Chapter(s) created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
        put: {
          tags: ['Chapters'],
          summary: 'Update one or many chapters',
          description: 'Pass a single chapter object (with `id`) or an array for bulk updates.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Chapter' },
                    { type: 'array', items: { $ref: '#/components/schemas/Chapter' } },
                  ],
                },
                examples: {
                  single: { summary: 'Update single', value: { id: 'GEN.1', bookId: 'GEN', number: '1', reference: 'Genesis 1' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Chapter(s) updated' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/chapters/{bibleId}/{chapterId}': {
        delete: {
          tags: ['Chapters'],
          summary: 'Delete a chapter',
          description: 'Cascades — also deletes the verse content for this chapter.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'chapterId', required: true, schema: { type: 'string' }, example: 'GEN.1' },
          ],
          responses: {
            200: { description: 'Deleted successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/verses/{bibleId}/{bookId}': {
        get: {
          tags: ['Verses'],
          summary: 'Get all verse content for a book',
          description: 'Returns an object keyed by chapter id, e.g. `{ "GEN.1": { ... }, "GEN.2": { ... } }`.',
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'bookId', required: true, schema: { type: 'string' }, example: 'GEN' },
          ],
          responses: {
            200: { description: 'Verse content by chapter', content: { 'application/json': { schema: { type: 'object', additionalProperties: { $ref: '#/components/schemas/Verse' } } } } },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },

      '/verses/{bibleId}/{bookId}/{verseId}': {
        get: {
          tags: ['Verses'],
          summary: 'Get verse content for a single chapter',
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'bookId', required: true, schema: { type: 'string' }, example: 'GEN' },
            { in: 'path', name: 'verseId', required: true, schema: { type: 'string' }, example: 'GEN.1' },
          ],
          responses: {
            200: { description: 'Verse content found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Verse' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/verses/{bibleId}': {
        post: {
          tags: ['Verses'],
          summary: 'Create verse content for one or many chapters',
          description: 'Pass a single verse-content object or an array for bulk creation. `bibleId` is taken from the URL.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Verse' },
                    { type: 'array', items: { $ref: '#/components/schemas/Verse' } },
                  ],
                },
                examples: {
                  single: {
                    summary: 'Single chapter content',
                    value: {
                      id: 'GEN.1',
                      bookId: 'GEN',
                      number: '1',
                      reference: 'Gen. 1',
                      verseCount: 2,
                      content: [
                        {
                          name: 'para', type: 'tag', attrs: { style: 'p' }, items: [
                            { name: 'verse', type: 'tag', attrs: { number: '1', style: 'v', sid: 'GEN 1:1' }, items: [{ text: '1', type: 'text' }] },
                            { text: 'In the beginning God created the heavens and the earth.', type: 'text', attrs: { verseId: 'GEN.1.1', verseOrgIds: ['GEN.1.1'] } },
                          ]
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Verse content created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
        put: {
          tags: ['Verses'],
          summary: 'Update verse content for one or many chapters',
          description: 'Pass a single verse-content object (with `id`) or an array for bulk updates.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Verse' },
                    { type: 'array', items: { $ref: '#/components/schemas/Verse' } },
                  ],
                },
              },
            },
          },
          responses: {
            200: { description: 'Verse content updated' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/verses/{bibleId}/{verseId}': {
        delete: {
          tags: ['Verses'],
          summary: 'Delete verse content for a single chapter',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { in: 'path', name: 'bibleId', required: true, schema: { type: 'string' }, example: '78a9f6124f344018-01' },
            { in: 'path', name: 'verseId', required: true, schema: { type: 'string' }, example: 'GEN.1' },
          ],
          responses: {
            200: { description: 'Deleted successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
    },
  },
  apis: [],
};
