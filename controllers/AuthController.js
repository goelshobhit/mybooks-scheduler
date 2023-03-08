const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcrypt");


exports.bulkExperts = [
	// Process request after validation and sanitization.
	(req, res) => {
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

			Array.from({ length: req.body.count }).forEach(() => {
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

			return apiResponse.successResponse(res, "created");
		} catch (err) {
			console.error(err);
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];



exports.bulkUsers = [
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			const USERS = [];

			const createRandomUser = () => {
				let ID = uuidv4();
				return {
					firstName: faker.internet.userName(),
					lastName: faker.internet.userName(),
					email: faker.internet.email(),
					type: "CUSTOMER",
					uuid: ID,
					identifier: `CUSTOMER_${ID}`,
				};
			};

			Array.from({ length: 20 }).forEach(() => {
				USERS.push(createRandomUser());
			});

			USERS.forEach((item) => {
				bcrypt.hash("12345678abc", 10, function (err, hash) {
					// Create User object with escaped and trimmed data
					const query = {};
					const projection = {_id: 1 };
					try {
						ExpertModel.find(query, projection).then((users) => {
							var expertId = users[Math.floor(Math.random()*users.length)]["_id"];
							var user = new UserModel({
								password: hash,
								allocatedTo: expertId,
								...item,
							});
							user.save(function (err) {
								if (err) {
									console.error(err);
								}
							});
						});
					} catch(err) {
						return apiResponse.ErrorResponse(res, err);
					}

					
		
					
				});
			});

			try {
				const query = {};
				const projection = {};
				ExpertModel.find(query, projection).then((users) => {
					return apiResponse.successResponseWithData(res,"created", users);
				});
			} catch(err){
				return apiResponse.successResponse(res, "created");
			}

		} catch (err) {
		
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];