const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String },
  purpose: { type: String, enum: ["register", "reset"], default: "register" },
  token: { type: String }, // for reset link
  meta: { type: mongoose.Schema.Types.Mixed }, // store temp payload like role/phone/password
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Otp", OtpSchema);
