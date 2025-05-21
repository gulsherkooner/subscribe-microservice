const express = require('express');
const mongoose = require("mongoose")
const dotenv = require('dotenv');
dotenv.config();
const followerRoutes = require('./routes/followers');
const cors = require('./config/cors');


const app = express();
const PORT = process.env.PORT || 3005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/post_service';

// Middleware
app.use(cors)
app.use(express.json());

// Routes
app.use('/followers', followerRoutes);

// Start server
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Post Service running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));