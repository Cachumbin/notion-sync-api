const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const syncRoutes = require('./routes/sync');

const app = express();
app.use(express.text());
app.use('/sync', syncRoutes);

module.exports = app;
