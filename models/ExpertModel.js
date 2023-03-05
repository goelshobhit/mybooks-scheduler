var mongoose = require("mongoose");

var ExpertSchema = new mongoose.Schema({
	uuid: {type: String, required: true},
	identifier: {type: String, required: true},
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	email: {type: String, required: true},
	password: {type: String, required: true},
}, {timestamps: true});

module.exports = mongoose.model("Expert", ExpertSchema);
