const express = require('express');
const mongoose = require("mongoose")
const dotenv = require('dotenv');
dotenv.config();
const followerRoutes = require('./src/routes/followers');
const membershipRoutes = require('./src/routes/memberships');
const cors = require('./src/config/cors');
const sequelize = require('./src/config/db');
const logger = require('./src/config/logger');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3005;

// Increase payload size limit to handle large video uploads
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(bodyParser.json({ limit: "150mb" }));
app.use(bodyParser.urlencoded({ limit: "150mb", extended: true }));

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
app.use('/memberships', membershipRoutes);

app.listen(PORT, () => {
  logger.info(`Subscription service running on port ${PORT}`);
});
