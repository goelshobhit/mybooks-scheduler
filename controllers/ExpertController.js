//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const ExpertAssigned = require("../models/ExpertAssigned");
const JobModel = require("../models/JobModel");
const TaskAssigned = require("../models/TaskAssigned");

exports.getInfo = [
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			ExpertAssigned.find({ expertId: req.body.id}, {customerId: 1}).then(customers => {
				customers.forEach(customer => {
					TaskAssigned.find({customerId: customer.customerId }, {_id: 0}).then(tasks => {
						tasks.forEach(taskData => {
							JobModel.find({customerId: taskData.customerId }, {type:1,name:1}).then(jobList => {
								return apiResponse.successResponseWithData(res, "job completed", jobList);
							});
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


exports.completeJob = [
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			TaskAssigned.find({ jobId: req.body.jobId }, {_id: 0}).then(tasks => {
				console.log(tasks);
				
				tasks.forEach(taskData => {
					TaskAssigned.deleteMany({ jobId: taskData.jobId });
					JobModel.findByIdAndUpdate({ _id: taskData.jobId }, { status: "COMPLETED"}).then(updatedRes => {
						return apiResponse.successResponseWithData(res, "job completed", updatedRes);
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