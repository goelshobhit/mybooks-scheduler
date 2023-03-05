var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
	uuid: {type: String, required: true},
	identifier: {type: String, required: true},
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	email: {type: String, required: true},
	password: {type: String, required: true},
	allocatedTo: {type: String, required: true},
}, {timestamps: true});

const User = mongoose.model("User", UserSchema);
module.exports = { User, UserSchema};