var mongoose = require("mongoose");

var ExpertAssignedSchema = new mongoose.Schema({
	customerId: {type: mongoose.Types.ObjectId, ref: "User"},
	expertId: {type: mongoose.Types.ObjectId, ref: "Expert"},
}, {timestamps: true});


module.exports = mongoose.model("ExpertAssigned", ExpertAssignedSchema);