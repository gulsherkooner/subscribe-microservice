const express = require("express");
const redis = require("../config/redis");
const logger = require("../config/logger");
const Follower = require("../models/follower");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3002";

const fetchAuth = async (route, method, user_id, body = null) => {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user_id,
      },
      credentials: "include",
    };

    if (
      body &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())
    ) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${authServiceUrl}/${route}`, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    try {
      return await response.json();
    } catch {
      return await response.text();
    }
  } catch (error) {
    return { error: true, message: error.message || "Unknown error" };
  }
};

// Follow a user
router.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { target_userid } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }
    if (!target_userid) {
      return res.status(400).json({ error: "Target user ID required" });
    }
    if (userId === target_userid) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if already following
    const existingFollow = await Follower.findOne({
      where: { user_id: userId, target_userid },
    });
    if (existingFollow) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Create follow relationship
    await Follower.create({
      follow_id: uuidv4(),
      user_id: userId,
      target_userid,
      created_at: new Date(),
    });

    // Update user counts (followers/following) in auth-service
    try {
      const followingUpdate = await fetchAuth("user", "PUT", userId, { following: 1 });
      const followersUpdate = await fetchAuth("user", "PUT", target_userid, { followers: 1 });
      if (followingUpdate.error || followersUpdate.error) {
        throw new Error(followingUpdate.message || followersUpdate.message || "Auth service update failed");
      }
    } catch (error) {
      logger.error(`Follow error: ${error.message}`);
      return res.status(402).json({ error: error.message });
    }

    // Clear Redis caches
    await redis.del(`followers:${target_userid}`);
    await redis.del(`following:${userId}`);

    res.status(201).json({ message: "Successfully followed user" });
  } catch (error) {
    logger.error(`Follow error: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unfollow a user
router.delete("/:target_userid", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { target_userid } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }
    if (!target_userid) {
      return res.status(400).json({ error: "Target user ID required" });
    }

    // Check if following
    const deleted = await Follower.destroy({
      where: { user_id: userId, target_userid },
    });
    if (!deleted) {
      return res.status(400).json({ error: "Not following this user" });
    }

    // Update user counts in auth-service
    try {
      const followingUpdate = await fetchAuth("user", "PUT", userId, { following: -1 });
      const followersUpdate = await fetchAuth("user", "PUT", target_userid, { followers: -1 });
      if (followingUpdate.error || followersUpdate.error) {
        throw new Error(followingUpdate.message || followersUpdate.message || "Auth service update failed");
      }
    } catch (error) {
      logger.error(`Unfollow error: ${error.message}`);
      return res.status(402).json({ error: error.message });
    }

    // Clear Redis caches
    await redis.del(`followers:${target_userid}`);
    await redis.del(`following:${userId}`);

    res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (error) {
    logger.error(`Unfollow error: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check follow status
router.get("/check/:target_userid", async (req, res) => {
  const { target_userid } = req.params;
  const userId = req.headers["x-user-id"];
  try {
    if (!userId || !target_userid) {
      return res.status(401).json({ error: "User ID and target user ID required" });
    }
    if (userId === target_userid) {
      return res
        .status(400)
        .json({ error: "Cannot check follow status for yourself" });
    }

    // Query database
    const follow = await Follower.findOne({
      where: { user_id: userId, target_userid },
    });
    const isFollowing = !!follow;

    res.status(200).json({ isFollowing });
  } catch (error) {
    logger.error(`Check follow status error: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Get followers for a user
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const cacheKey = `followers:${user_id}`;

    // Check Redis cache
    const cachedFollowers = await redis.get(cacheKey);
    if (cachedFollowers) {
      return res.status(200).json({ followers: JSON.parse(cachedFollowers) });
    }

    // Fetch followers from database (Sequelize)
    const followers = await Follower.findAll({
      where: { target_userid: user_id },
      attributes: ["user_id", "created_at"],
      raw: true,
    });

    // Cache result
    await redis.setex(cacheKey, 3600, JSON.stringify(followers));

    res.status(200).json({ followers });
  } catch (error) {
    logger.error(`Get followers error: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get users a user is following
router.get("/following/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const cacheKey = `following:${user_id}`;

    // Check Redis cache
    const cachedFollowing = await redis.get(cacheKey);
    if (cachedFollowing) {
      return res.status(200).json({ following: JSON.parse(cachedFollowing) });
    }

    // Fetch following from database (Sequelize)
    const following = await Follower.findAll({
      where: { user_id },
      attributes: ["target_userid", "created_at"],
      raw: true,
    });

    // Cache result
    await redis.setex(cacheKey, 3600, JSON.stringify(following));

    res.status(200).json({ following });
  } catch (error) {
    logger.error(`Get following error: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
