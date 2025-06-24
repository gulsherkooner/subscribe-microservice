const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Membership = require("../models/membership");
const logger = require("../config/logger");
const UploadToDropbox = require("../config/dropbox.js");
const getDbxToken = require("../utils/getDbxToken.js");

const router = express.Router();

// Middleware to increase payload size limit
router.use(express.json({ limit: "100mb" }));
router.use(express.urlencoded({ limit: "100mb", extended: true }));

// Create a new membership
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      MonthlyPrice,
      country,
      introVideo,
      payPerViewPrice,
      perks,
    } = req.body;

    // Check if x-user-id header matches user_id in body
    const xUserId = req.headers["x-user-id"];
    if (!xUserId || xUserId !== user_id) {
      return res.status(403).json({ error: "Forbidden: user_id mismatch" });
    }

    // Check if user already has a membership
    const existing = await Membership.findOne({ where: { user_id } });
    if (existing) {
      return res.status(400).json({ error: "Membership already exists for this user." });
    }

    let introVideoUrl = null;
    let introVideoMeta = null;

    // Upload introVideo to Dropbox if present and has media_content
    if (introVideo && introVideo.media_content) {
      const dbxAccessToken = await getDbxToken();
      if (!dbxAccessToken) {
        logger.error("Failed to get Dropbox access token");
        return res.status(500).json({ error: "Failed to get Dropbox access token" });
      }
      const fileName = introVideo.media_name;
      const fileContent = introVideo.media_content;
      introVideoUrl = await UploadToDropbox(fileContent, fileName, dbxAccessToken, res);
      if (!introVideoUrl) {
        return res.status(500).json({ error: "Failed to upload intro video to Dropbox" });
      }
      introVideoMeta = {
        media_type: introVideo.media_type,
        media_name: introVideo.media_name,
        media_url: introVideoUrl,
      };
    } else if (introVideo && introVideo.media_url) {
      // If already a URL, just use it
      introVideoMeta = {
        media_type: introVideo.media_type,
        media_name: introVideo.media_name,
        media_url: introVideo.media_url,
      };
    }

    const membership = await Membership.create({
      membership_id: uuidv4(),
      user_id,
      MonthlyPrice,
      country,
      introVideo: introVideoMeta,
      payPerViewPrice,
      perks,
      is_active: true,
    });

    res.status(201).json(membership);
  } catch (err) {
    logger.error(`Failed to create membership: ${err.message}`);
    res.status(500).json({ error: "Failed to create membership", details: err.message });
  }
});

// Get a user's membership by user_id
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const membership = await Membership.findOne({ where: { user_id } });
    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }
    res.json(membership);
  } catch (err) {
    res.status(500).json({ error: "Failed to get membership", details: err.message });
  }
});

// Get a membership by membership_id
router.get("/:membership_id", async (req, res) => {
  try {
    const { membership_id } = req.params;
    const membership = await Membership.findByPk(membership_id);
    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }
    res.json(membership);
  } catch (err) {
    res.status(500).json({ error: "Failed to get membership", details: err.message });
  }
});

module.exports = router;