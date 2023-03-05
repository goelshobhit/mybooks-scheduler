const UserModel = require("../models/UserModel").User;
const ExpertModel = require("../models/ExpertModel");
const TaskModel = require("../models/TaskModel");
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const path = require("path");
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/jwt");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const { EmailTemplate } = require("email-templates");
/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
	// Validate fields.
	body("firstName")
		.isLength({ min: 1 })
		.trim()
		.withMessage("First name must be specified.")
		.isAlphanumeric()
		.withMessage("First name has non-alphanumeric characters."),
	body("lastName")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Last name must be specified.")
		.isAlphanumeric()
		.withMessage("Last name has non-alphanumeric characters."),
	body("email")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Email must be specified.")
		.isEmail()
		.withMessage("Email must be a valid email address.")
		.custom((value) => {
			return UserModel.findOne({ email: value }).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	body("password")
		.isLength({ min: 6 })
		.trim()
		.withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error.",
					errors.array()
				);
			} else {
				//hash input password
				bcrypt.hash(req.body.password, 10, function (err, hash) {
					// Create User object with escaped and trimmed data
					var user = new UserModel({
						firstName: req.body.firstName,
						lastName: req.body.lastName,
						email: req.body.email,
						password: hash,
						isAdmin: req.body.isAdmin,
						isWecomeMailSent: new Date(),
					});

					let templateDir = path.join(__dirname, "../", "templates", "welcome");
					const Receipt = new EmailTemplate(templateDir);

					Receipt.render(
						{
							name: req.body.firstName,
						},
						(error, welcomeTemplate) => {
							if (error) {
								return console.log("Error sending mail");
							}
							mailer
								.send(
									constants.confirmEmails.from,
									req.body.email,
									"Confirm Account",
									welcomeTemplate.html
								)
								.then(function () {
									// Save user.
									user.save(function (err) {
										if (err) {
											return apiResponse.ErrorResponse(res, err);
										}
										let userData = {
											_id: user._id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										};
										return apiResponse.successResponseWithData(
											res,
											"Registration Success.",
											userData
										);
									});
								})
								.catch((err) => {
									console.log(err);
									return apiResponse.ErrorResponse(res, err);
								});
						}
					);
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */

exports.login = [
	body("email")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Email must be specified.")
		.isEmail()
		.withMessage("Email must be a valid email address."),
	body("password")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error.",
					errors.array()
				);
			} else {
				UserModel.findOne({ email: req.body.email }).then((user) => {
					if (user) {
						//Compare given password with db's hash.
						bcrypt.compare(
							req.body.password,
							user.password,
							function (err, same) {
								if (same) {
									let userData = {
										_id: user._id,
										firstName: user.firstName,
										lastName: user.lastName,
										email: user.email,
										isAdmin: user.isAdmin,
										isUserInMailingList: user.isUserInMailingList,
										isAdminMailSent: user.isAdminMailSent,
										isWecomeMailSent: user.isWecomeMailSent,
									};
									//Prepare JWT token for authentication
									const jwtPayload = userData;
									const secret = process.env.JWT_SECRET;
									//Generated JWT token with Payload and secret.
									userData.token = jwt.sign(jwtPayload, secret);
									return apiResponse.successResponseWithData(
										res,
										"Login Success.",
										userData
									);
								} else {
									return apiResponse.unauthorizedResponse(
										res,
										"Email or Password wrong."
									);
								}
							}
						);
					} else {
						return apiResponse.unauthorizedResponse(
							res,
							"Email or Password wrong."
						);
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

exports.getUsers = [
	auth,
	(req, res) => {
		const query = { isAdmin: false };
		const projection = { password: 0 };
		try {
			UserModel.find(query, projection).then((users) => {
				return apiResponse.successResponseWithData(res, "User List", users);
			});
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

exports.sendEmailToUser = [
	// Validate fields.
	auth,
	(req, res) => {
		try {
			let templateDir = path.join(__dirname, "../", "templates", "adminEmail");
			const Receipt = new EmailTemplate(templateDir);

			Receipt.render(
				{
					name: "Hey!",
					content: req.body.emailContent,
				},
				(error, welcomeTemplate) => {
					if (error) {
						return console.log("Error sending mail");
					}
					mailer
						.send(
							constants.confirmEmails.from,
							req.body.userEmails,
							req.body.subject,
							welcomeTemplate.html
						)
						.then(async function () {
							try {
								return apiResponse.successResponseWithData(
									res,
									"Mail has been sent",
									{}
								);
							} catch (e) {
								console.log(e);
								return apiResponse.ErrorResponse(res, e);
							}
						})
						.catch((err) => {
							console.log(err);
							return apiResponse.ErrorResponse(res, err);
						});
				}
			);
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

exports.mailRegister = [
	auth,
	(req, res) => {
		try {
			UserModel.findById(req.body.id).then((user) => {
				if (!user) {
					return apiResponse.ErrorResponse(res, "No user found");
				}

				let templateDir = path.join(
					__dirname,
					"../",
					"templates",
					"adminEmail"
				);
				const Receipt = new EmailTemplate(templateDir);

				Receipt.render(
					{
						name: req.body.firstName,
						content: "Thanks you for registered with US",
					},
					(error, welcomeTemplate) => {
						if (error) {
							return console.log("Error sending mail");
						}
						mailer
							.send(
								constants.confirmEmails.from,
								user.email,
								req.body.subject,
								welcomeTemplate.html
							)
							.then(async function () {
								try {
									const updatedUser = await UserModel.findOneAndUpdate(
										{
											_id: req.body.id,
										},
										{
											$set: { isUserInMailingList: 1 },
										},
										{
											new: true,
										}
									);
									return apiResponse.successResponseWithData(
										res,
										"You have been registered inside our mailing list",
										updatedUser
									);
								} catch (e) {
									return apiResponse.ErrorResponse(res, e);
								}
							})
							.catch((err) => {
								console.log(err);
								return apiResponse.ErrorResponse(res, err);
							});
					}
				);
			});
		} catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

exports.bulkExperts = [
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
					type: "EXPERT",
					uuid: ID,
					identifier: `EXPERT_${ID}`,
				};
			};

			Array.from({ length: req.body.count }).forEach(() => {
				USERS.push(createRandomUser());
			});

			USERS.forEach((item) => {
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


exports.bulkTasks = [
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			const TASKS = [];

			const createRandomTask = () => {
				return {
					name: `TASK_${faker.internet.userName()}`,
				};
			};

			Array.from({ length: req.body.count }).forEach(() => {
				TASKS.push(createRandomTask());
			});

			TASKS.forEach((item) => {
				var task = new TaskModel({
					...item,
					status: "CREATED",
					type: "REVIEW SALES",
				});
				task.save(function (err) {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					}
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

			Array.from({ length: req.body.count }).forEach(() => {
				USERS.push(createRandomUser());
			});

			USERS.forEach((item) => {
				bcrypt.hash("12345678", 10, function (err, hash) {
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