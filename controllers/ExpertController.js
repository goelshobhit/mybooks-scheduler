//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const { filter, isEqual, map, flatMapDepth } = require('lodash');
const ExpertAssigned = require("../models/ExpertAssigned");
const JobModel = require("../models/JobModel");
const TaskAssigned = require("../models/TaskAssigned");
const UserModel = require("../models/UserModel");

exports.getInfo = [
	// Process request after validation and sanitization.
	(req, res) => {
		try {

			console.log(req.body.id);

			UserModel.aggregate([
				{
					"$lookup": {
						"from": "jobs", 
						"let": {
							"episodeId": "$_id"
						}, 
						"pipeline": [
							{
								"$match": {
									"$expr": {
										"$eq": [
											"$customerId", "$$episodeId"
										]
									}
								}
							}
						], 
						"as": "jobs"
					}
				}
			]).then(data => {

				const filterExperData = filter(data, ({ allocatedTo}) => isEqual(allocatedTo, req.body.id));

				const mappedData = map(filterExperData, item => {
					const data = {
						...item,
						jobs: item.jobs.map(jobData => jobData._id),
					};
					return data;
				});

				return apiResponse.successResponseWithData(res, "expertlist", mappedData);
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