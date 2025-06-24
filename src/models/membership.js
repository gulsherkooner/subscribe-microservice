const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Membership = sequelize.define(
  "Membership",
  {
    membership_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    MonthlyPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    introVideo: {
      // Store only the URL and metadata, not base64
      type: DataTypes.JSON,
      allowNull: true,
      // Example: { media_type: "video", media_name: "intro.mp4", media_url: "https://..." }
      defaultValue: null,
    },
    payPerViewPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    perks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "memberships",
    timestamps: false,
    indexes: [{ fields: ["user_id"] }],
  }
);

module.exports = Membership;