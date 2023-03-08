/**
 * @file Illustrate concurrency and locking
 */
const Agenda = require("agenda");
const config = require("../config");
const ExpertModel = require("../models/ExpertModel");
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
//helper file to prepare responses.
const bcrypt = require("bcrypt");

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
		collection: "users" // Start fresh every time
	}
});

let jobRunCount = 1;
agenda.define(
	config.createExperts,
	{
		lockLifetime: 5 * 1000, // Max amount of time the job should take
		concurrency: 1 // Max number of job instances to run at the same time
	},
	async(job, done) => {
		const thisJob = jobRunCount++;
		try {
			const EXPERTS = [];

			const createRandomUser = () => {
				let ID = uuidv4();
				return {
					firstName: faker.internet.userName(),
					lastName: faker.internet.userName(),
					email: faker.internet.email(),
					type: "EXPERT",
					uuid: ID,
					identifier: `EXPERT_${ID}`,
				};
			};

			Array.from({ length: 1 }).forEach(() => {
				EXPERTS.push(createRandomUser());
			});

			EXPERTS.forEach((item) => {
				bcrypt.hash("12345678", 10, function (err, hash) {
					// Create User object with escaped and trimmed data
					var expert = new ExpertModel({
						password: hash,
						...item,
					});
					expert.save(function (err) {
						if (err) {
							console.error(err);
						}
					});
				});
			});

			
		} catch (err) {
		
			//throw error in json response with status 500.
	
		}
		// 3 job instances will be running at the same time, as specified by `concurrency` above
		await sleep(30 * 1000);

		console.log(`#${thisJob} of ${job.attrs.name} finished`);
		done();
	}
);

const createUserScheduler = async () => {
	console.log(time(), "Agenda started");
	agenda.processEvery("1 second");
	await agenda.start();
	await agenda.every("1 second", config.createExperts);

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

module.exports = createUserScheduler;