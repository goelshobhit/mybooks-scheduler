var mongoose = require("mongoose");

var TaskSchema = new mongoose.Schema({
	name: {type: String, required: true},
	status: {type: String, enum : ["CREATED","COMPLETED", "ASSIGNED", "DONE"],default: "CREATED"},
	deadline: {type: Number, required: true, default: 2 },
	runtime:{type: Number, required: true, default: 2 },
	type: {type: String, enum : ["REVIEW SALES","REVIEW PURCHASES", "COMPUTE TAX", "ADD TAX TO BOOKS"],default: "REVIEW SALES"},
	completedBy: {type: String, required: false, default: "none"},
}, {timestamps: true});

module.exports = mongoose.model("Task", TaskSchema);