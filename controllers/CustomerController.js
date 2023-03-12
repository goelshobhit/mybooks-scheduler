//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const ExpertAssigned = require("../models/ExpertAssigned");
const ExpertModel = require("../models/ExpertModel");
const JobModel = require("../models/JobModel");
const config = require("../config");

const moment = require("moment");
const { sum, filter, map, isEqual, toInteger} = require("lodash");

const ExpertAssignedModel = require("../models/ExpertAssigned");
const UserModel = require("../models/UserModel");
const TaskAssigned = require("../models/TaskAssigned");


exports.getInfo = [
	// Process request after validation and sanitization.
	(req, res) => {

		const query = {};
		const projection = { _id: 1 };

		try {
			JobModel.find({ customerId: req.body.id }, { password: 0, _id: 0}).then((jobRes) => {
				ExpertAssigned.find({ customerId: req.body.id }, { expertId: 1, _id: 0}).then(expRes => {
					expRes.forEach(element => {
						ExpertModel.find({ _id: element.expertId}, { firstName: 1, lastName: 1, _id: 0}).then(expData => {

							if(expData.length === 0) {
								ExpertModel.find(query, projection).then((experts) => {
									const expertIds = experts.map((item) => item._id);
					
									const randomUserId = req.body.id;
									const randomExpertId =
							  expertIds[Math.floor(Math.random() * expertIds.length)];
					
									const assignedExpert = new ExpertAssignedModel({
										customerId: randomUserId,
										expertId: randomExpertId,
									});
					
									assignedExpert.save(function (err) {
										if (err) {
											console.error(err);
										}
									});
									return apiResponse.successResponseWithData(
										res,
										"user information",
										{jobs: jobRes, assignedExp: assignedExpert},
									);
								});
							}
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


exports.createJob = [
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			const jobModel = new JobModel({
				name: `Book ${req.body.taskName}`,
				type: req.body.type,
				maxAllocatedTimeInHr: config.instancesAllocationTime[req.body.type],
				customerId: req.body.customerId,
			});
			jobModel.save(function (err) {
				if (err) {
					console.error(err);
				}
			});

			return apiResponse.successResponseWithData(
				res,
				"user information",
				{job: jobModel},
			);

		} catch (err) {
			console.error(err);
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];