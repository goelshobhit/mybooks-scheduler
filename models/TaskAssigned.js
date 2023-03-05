var mongoose = require("mongoose");

var TaskAssignedSchema = new mongoose.Schema({
	customerId: {type: mongoose.Types.ObjectId, ref: "User"},
	expertId: {type: mongoose.Types.ObjectId, ref: "Expert"},
}, {timestamps: true});


module.exports = mongoose.model("TaskAssigned", TaskAssignedSchema);