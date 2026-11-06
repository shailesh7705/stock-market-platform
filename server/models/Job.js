const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    _id: { type: String },
    lockedUntil: { type: Date, required: true },
    owner: { type: String, default: "" },
  },
  { collection: "jobs", versionKey: false }
);

module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
