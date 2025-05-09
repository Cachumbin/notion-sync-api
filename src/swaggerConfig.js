const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notion Sync API',
            version: '1.0.0',
            description: 'API for syncing Notion and Apple Reminders',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Server'
            },
            {
                url: 'https://notion-sync-api.vercel.app',
                description: 'Production Server'
            }
        ]
    },
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
