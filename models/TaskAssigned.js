var mongoose = require("mongoose");

var TaskAssignedSchema = new mongoose.Schema({
	customerId: {type: mongoose.Types.ObjectId, ref: "User"},
	expertId: {type: mongoose.Types.ObjectId, ref: "Expert"},
	jobId: {type: mongoose.Types.ObjectId, ref: "Job"},
	iobStatus: {type: String, enum : ["ASSIGNED","QUEUED"],default: "ASSIGNED"},
	expertTime: { type: Number, required: true}
}, {timestamps: true});


module.exports = mongoose.model("TaskAssigned", TaskAssignedSchema);