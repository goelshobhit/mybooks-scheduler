/**
 * @file Illustrate concurrency and locking
 */
const Agenda = require("agenda");

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
		collection: `agendaJobs-${Math.random()}` // Start fresh every time
	}
});

let jobRunCount = 1;
agenda.define(
	"long-running job",
	{
		lockLifetime: 5 * 1000, // Max amount of time the job should take
		concurrency: 3 // Max number of job instances to run at the same time
	},
	async(job, done) => {
		const thisJob = jobRunCount++;
		console.log(`#${thisJob} started`);

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
	await agenda.every("1 second", "long-running job");

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