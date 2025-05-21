const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const followerSchema = new mongoose.Schema({
  follow_id: { type: String, default: uuidv4, unique: true },
  user_id: { type: String, required: true, index: true },
  target_userid: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Follower', followerSchema);