/**
 * @file Illustrate concurrency and locking
 */
const Agenda = require("agenda");
const { faker } = require("@faker-js/faker");
const config = require("../config");
const JobModel = require("../models/JobModel");

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
		collection: "TaskAssigned" // Start fresh every time
	}
});

let jobRunCount = 1;
agenda.define(
	config.createJobs,
	{
		lockLifetime: 5 * 1000, // Max amount of time the job should take
		concurrency: 3 // Max number of job instances to run at the same time
	},
	async(job, done) => {
		const { instances } = config;
		const thisJob = jobRunCount++;
		console.log(`#${thisJob} started`);

		const selectedInstance = instances[Math.floor(Math.random()*instances.length)];

		const jobModel = new JobModel({
			name: `Book ${faker.internet.emoji()} ${faker.internet.userName()} ${faker.internet.domainWord()} `,
			status: selectedInstance,
			maxAllocatedTimeInHr: config.instancesAllocationTime[selectedInstance],
		});
		jobModel.save(function (err) {
			if (err) {
				console.error(err);
			}
		});
		// 3 job instances will be running at the same time, as specified by `concurrency` above
		await sleep(30 * 1000);

		console.log(`#${thisJob} finished`);
		done();
	}
);

const taskScheduler = async () => {
	console.log(time(), "Agenda started");
	agenda.processEvery("1 second");
	await agenda.start();
	await agenda.every("1 second", config.createJobs);

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

module.exports = taskScheduler;