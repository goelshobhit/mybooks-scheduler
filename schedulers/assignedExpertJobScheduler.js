/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * @file Illustrate concurrency and locking
 */
const Agenda = require("agenda");
const moment = require("moment");
const { sum, filter, map, isEqual, toInteger} = require("lodash");
const config = require("../config");
const ExpertAssignedModel = require("../models/ExpertAssigned");
const JobModel = require("../models/JobModel");
const ExpertModel = require("../models/ExpertModel");
const UserModel = require("../models/UserModel");
const TaskAssigned = require("../models/TaskAssigned");


function time() {
	return new Date().toTimeString().split(" ")[0];
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

const agenda = new Agenda({
	db: {
		address: process.env.MONGODB_URL,
		options: { useNewUrlParser: true },
		collection: "TaskAssigned", // Start fresh every time
	},
});

let jobRunCount = 1;
agenda.define(
	config.assignedExportJobs,
	{
		lockLifetime: 1000, // Max amount of time the job should take
		concurrency: 4, // Max number of job instances to run at the same time
	},
	async (job, done) => {
		const thisJob = jobRunCount++;
		console.log(`#${thisJob} started`);

		ExpertAssignedModel.find({}, {}).then(
			(res) => {
				if (res.length !== 0) {
					res.forEach((expertData) => {
						TaskAssigned.find({ expertId: expertData.expertId }, {}).then(
							(tasks) => {
								if (tasks.length !== 0) {
									const isExpertAvailable = sum(map(filter(tasks, (expertId) => isEqual(expertData.expertId,expertId)), item => toInteger(item.expertTime))) <= 8;
									// check if expert has time to complete the task
									if(isExpertAvailable){
										tasks.forEach(taskData => {
											JobModel.find({ customerId: taskData.customerId}, {}).then(
												(jobs) => {
													// find expert customer jobs and allocated to expert
													// need to update job status assigned 
													if (jobs.length !== 0) {
														// assigned task to experts
														jobs.forEach(jobData => {
										
															var taskAssigned = new TaskAssigned({
																customerId: expertData.customerId,
																expertId: expertData.expertId,
																jobId: jobData._id,
																expertTime: jobData.maxAllocatedTimeInHr || 2,
															});
															taskAssigned.save(function (err) {
																if (err) {
																	console.error(err);
																}
															});

															if(moment(job.createdAt)
																.isBefore(moment(job.createdAt).add(jobData.maxAllocatedTimeInHr || 2, "hours"))) {
																JobModel.findOneAndUpdate({ _id: jobData._id}, { status:"ASSIGNED"});
															} else {
																JobModel.findOneAndUpdate({ _id: jobData._id}, { status:"QUEUED"});
															}
															
															
														});
														
													}

													// update jo
												}
											);
										});
									} else {
										tasks.forEach(taskData => {
											JobModel.find({ customerId: taskData.customerId}, {}).then(
												(jobs) => {
													// find expert customer jobs and allocated to expert
													// need to update job status assigned 
													if (jobs.length !== 0) {
														// assigned task to experts
														jobs.forEach(jobData => {
															var taskAssigned = new TaskAssigned({
																customerId: expertData.customerId,
																expertId: expertData.expertId,
																jobId: jobData._id,
																jobStatus: "QUEUED",
																expertTime: jobData.maxAllocatedTimeInHr,
															});
															taskAssigned.save(function (err) {
																if (err) {
																	console.error(err);
																}
															});

															if(moment(job.createdAt)
																.isBefore(moment(job.createdAt).add(jobData.maxAllocatedTimeInHr || 2, "hours"))) {
																JobModel.findOneAndUpdate({ _id: jobData._id}, { status:"ASSIGNED"});
															} else {
																JobModel.findOneAndUpdate({ _id: jobData._id}, { status:"QUEUED"});
															}
														});
														
													}

													// update jo
												}
											);
										});
									}
									// else job is assigned to expert as queued

								} else {
									// need to assigned those jobs which are un-assigned
								}
							}
						);
					});
					res.forEach((expertData) => {
						TaskAssigned.find().then(notAssignedRes => {
							if(notAssignedRes.length !== 0 ){
								JobModel.find().then(notAssignedJobs => {
									// if not assigned any taks then expert assigned task
									notAssignedJobs.forEach(unAssignedJobData => {
										const assignedJobToExpert = new TaskAssigned({
											customerId: unAssignedJobData.customerId,
											jobId: unAssignedJobData._id,
											expertTime: unAssignedJobData.maxAllocatedTimeInHr || 2,
											expertId: expertData.expertId,
											
										});
						
										assignedJobToExpert.save(function (err) {
											if (err) {
												console.error(err);
											}
										});

										if(moment(unAssignedJobData.createdAt)
											.isBefore(moment(unAssignedJobData.createdAt).add(unAssignedJobData.maxAllocatedTimeInHr || 2, "hours"))) {
											JobModel.findOneAndUpdate({ _id: unAssignedJobData._id}, { status:"ASSIGNED"});
										} else {
											JobModel.findOneAndUpdate({ _id: unAssignedJobData._id}, { status:"QUEUED"});
										}
									});
								});
							}

							
							

							if(notAssignedRes.length === 0) {
								JobModel.find().then(notAssignedJobs => {
									// if not assigned any taks then expert assigned task
									notAssignedJobs.forEach(unAssignedJobData => {
										const assignedJobToExpert = new TaskAssigned({
											customerId: unAssignedJobData.customerId,
											jobId: unAssignedJobData._id,
											expertTime: unAssignedJobData.maxAllocatedTimeInHr || 2,
										});
						
										assignedJobToExpert.save(function (err) {
											if (err) {
												console.error(err);
											}
										});

										if(moment(unAssignedJobData.createdAt)
											.isBefore(moment(unAssignedJobData.createdAt).add(unAssignedJobData.maxAllocatedTimeInHr || 2, "hours"))) {
											JobModel.findOneAndUpdate({ _id: unAssignedJobData._id}, { status:"ASSIGNED"});
										} else {
											JobModel.findOneAndUpdate({ _id: unAssignedJobData._id}, { status:"QUEUED"});
										}
									});
								});
							}
						});
					});

				} else {
					const query = {};
					const projection = {_id: 1};
					// assigned expert to customer
					UserModel.find(query, projection).then((users) => {
						const userIds = users.map((item) => item._id);
						ExpertModel.find(query, projection).then((experts) => {
							const expertIds = experts.map((item) => item._id);
			
							const randomUserId =
					  userIds[Math.floor(Math.random() * userIds.length)];
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
			
						});
					});
				
				}
			}
		);
		// 3 job instances will be running at the same time, as specified by `concurrency` above
		await sleep(30 * 1000);

		console.log(`#${thisJob} finished`);
		done();
	}
);

const assignedExpertJobScheduler = async () => {
	console.log(time(), "Agenda started");
	agenda.processEvery("0.5 hour");
	await agenda.start();
	await agenda.every("0.5 hour", config.assignedExportJobs);

	// Log job start and completion/failure
	agenda.on("start", (job) => {
		console.log(time(), `Job <${job.attrs.name}> starting`);
	});
	agenda.on("success", (job) => {
		console.log(time(), `Job <${job.attrs.name}> succeeded`);
	});
	agenda.on("fail", (error, job) => {
		console.log(time(), `Job <${job.attrs.name}> failed:`, error);
	});
};

module.exports = assignedExpertJobScheduler;
