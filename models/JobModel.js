var mongoose = require("mongoose");

var JobSchema = new mongoose.Schema({
	name: {type: String, required: true},
	status: {type: String, enum : ["REVIEW_SALES","REVIEW_PURCHASES", "COMPUTE_TAX", "ADD_TAX_TO_BOOKS"],default: "REVIEW_SALES"},
	completedByInDays: {type: String, required: false, default: 2},
	maxAllocatedTimeInHr: {type: String, required: true},
}, {timestamps: true});

module.exports = mongoose.model("Job", JobSchema);