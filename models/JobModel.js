var mongoose = require("mongoose");

var JobSchema = new mongoose.Schema({
	name: {type: String, required: true},
	type: {type: String, enum : ["REVIEW_SALES","REVIEW_PURCHASES", "COMPUTE_TAX", "ADD_TAX_TO_BOOKS"],default: "REVIEW_SALES"},
	status: {type: String, enum : ["CREATED","COMPLETED", "ASSIGNED","QUEUED"],default: "CREATED"},
	completedByInDays: {type: String, required: false, default: 2},
	maxAllocatedTimeInHr: {type: String, required: true},
	customerId: {type: mongoose.Types.ObjectId, ref: "User"},
}, {timestamps: true});

module.exports = mongoose.model("Job", JobSchema);