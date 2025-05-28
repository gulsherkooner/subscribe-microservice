const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Follower = sequelize.define(
  "Follower",
  {
    follow_id: {
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
    target_userid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "followers",
    timestamps: false,
    indexes: [{ fields: ["user_id"] }, { fields: ["target_userid"] }],
  }
);

module.exports = Follower;
