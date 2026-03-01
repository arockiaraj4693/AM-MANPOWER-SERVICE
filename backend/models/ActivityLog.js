const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["delete_application", "delete_user"],
    required: true,
  },
  performedBy: { type: String, required: true },
  performedByRole: { type: String },
  targetId: { type: String },
  targetName: { type: String },
  targetEmail: { type: String },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
