const express = require('express');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');

dotenv.config();

const syncRoutes = require('./routes/sync');
const app = express();
app.use(express.text());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount Routes
app.use('/sync', syncRoutes);

module.exports = app;
