const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  dob: { type: String },
  address: { type: String },
  contact: { type: String },
  jobTitle: { type: String },
  resume: { type: String },
  status: {
    type: String,
    enum: ["pending", "restricted", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Application", ApplicationSchema);
