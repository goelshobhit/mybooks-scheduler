const { last, includes, some } = require("lodash");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const ExpertModel = require("../models/ExpertModel");
const UserModel = require("../models/UserModel");

const loginHandler = (model, req, res) => {
	try {
		model.find({ identifier: req.body.id }).then((response) => {
			return apiResponse.successResponseWithData(res, "user information", last(response));
		});
	} catch (err) {
		console.error(err);
		//throw error in json response with status 500.
		return apiResponse.ErrorResponse(res, err);
	}
};

exports.sso = [
	// Process request after validation and sanitization.
	(req, res) => {
		console.log(req.body.id);
		const isUser = some(["CUSTOMER"], (el) => includes(req.body.id, el));

		if(isUser){
			loginHandler(UserModel, req, res);
		} else {
			loginHandler(ExpertModel, req, res);
		}
	}
		
];