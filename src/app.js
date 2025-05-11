const express = require('express');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');
const cors = require('cors');

dotenv.config();

const syncRoutes = require('./routes/sync');
const app = express();
app.use(express.text());
app.use(express.json());


app.use(cors());

app.use((req, res, next) => {
    console.log("🛰️  Incoming Request:");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next();
});

app.use((req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (username === process.env.API_USER && password === process.env.API_PASSWORD) {
        next();
    } else {
        res.status(403).json({ error: 'Invalid credentials' });
    }
});


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/sync', syncRoutes);

module.exports = app;
