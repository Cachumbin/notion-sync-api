const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const syncRoutes = require('./routes/sync');
const tasksRoutes = require('./routes/tasks');
const uploadRoutes = require('./routes/upload');

const app = express();

app.use(express.json());

app.use('/sync', syncRoutes);
app.use('/tasks', tasksRoutes);
app.use('/upload', uploadRoutes);

module.exports = app;
