const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });
const sequelize = require("../config/db");
// const Follower = require("../models/follower");
const Membership = require("../models/membership");

async function initDb() {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL");
    await sequelize.sync({ force: true }); // Creates table, drops if exists
    console.log("Followers table created");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initDb();
