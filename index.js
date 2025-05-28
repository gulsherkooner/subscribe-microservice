const express = require('express');
const mongoose = require("mongoose")
const dotenv = require('dotenv');
dotenv.config();
const followerRoutes = require('./src/routes/followers');
const cors = require('./src/config/cors');
const sequelize = require('./src/config/db');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors)
app.use(express.json());

sequelize
  .authenticate()
  .then(() => {
    logger.info('Connected to PostgreSQL');
  })
  .catch((error) => {
    logger.error('Error connecting to PostgreSQL:', error.message);
    process.exit(1);
  });

// Routes
app.use('/followers', followerRoutes);

app.listen(PORT, () => {
  logger.info(`Subscription service running on port ${PORT}`);
});
