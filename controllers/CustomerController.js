//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const ExpertAssigned = require("../models/ExpertAssigned");
const ExpertModel = require("../models/ExpertModel");
const JobModel = require("../models/JobModel");

exports.getInfo = [
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			JobModel.find({ customerId: req.body.id }, { password: 0, _id: 0}).then((jobRes) => {
				ExpertAssigned.find({ customerId: req.body.id }, { expertId: 1, _id: 0}).then(expRes => {
					expRes.forEach(element => {
						ExpertModel.find({ _id: element.expertId}, { firstName: 1, lastName: 1, _id: 0}).then(expData => {
							return apiResponse.successResponseWithData(
								res,
								"user information",
								{jobs: jobRes, assignedExp: expData},
							);
						});
					});
				
				});
			
			});
		} catch (err) {
			console.error(err);
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];
