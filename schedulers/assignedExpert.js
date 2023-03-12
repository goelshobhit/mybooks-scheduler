/**
 * @file Illustrate concurrency and locking
 */
const Agenda = require("agenda");
const config = require("../config");
const UserModel = require("../models/UserModel");
const ExpertModel = require("../models/ExpertModel");
const ExpertAssignedModel = require("../models/ExpertAssigned");

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
		collection: "expertassigned", // Start fresh every time
	},
});

let jobRunCount = 1;
agenda.define(
	config.assignedJobs,
	{
		lockLifetime: 5 * 1000, // Max amount of time the job should take
		concurrency: 3, // Max number of job instances to run at the same time
	},
	async (job, done) => {
		const thisJob = jobRunCount++;
		console.log(`#${thisJob} started`);

		const query = {};
		const projection = { _id: 1 };

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
		// 3 job instances will be running at the same time, as specified by `concurrency` above
		await sleep(30 * 1000);

		console.log(`#${thisJob} finished`);
		done();
	}
);

const assignedExpertScheduler = async () => {
	console.log(time(), "Agenda started for expert scheduler");
	agenda.processEvery("12 hours");
	await agenda.start();
	await agenda.every("12 hours", "long-running job");

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

module.exports = assignedExpertScheduler;
