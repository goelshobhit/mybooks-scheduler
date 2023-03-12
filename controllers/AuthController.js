const { last, includes, some } = require("lodash");
//helper file to prepare responses.
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const ExpertModel = require("../models/ExpertModel");
const UserModel = require("../models/UserModel");

const loginHandler = (model, req, res) => {
	try {
		model.find({ identifier: req.body.id }).then((response) => {
			return apiResponse.successResponseWithData(res, "user information", last(response));
		});
	} catch (err) {
		console.error(err);
		//throw error in json response with status 500.
		return apiResponse.ErrorResponse(res, err);
	}
};

exports.sso = [
	// Process request after validation and sanitization.
	(req, res) => {
		const isUser = some(["CUSTOMER"], (el) => includes(req.body.id, el));
		console.log(isUser);
		if(isUser){
			loginHandler(UserModel, req, res);
		} else {
			loginHandler(ExpertModel, req, res);
		}
	}
		
];

exports.signUp = [
	// Process request after validation and sanitization.
	(req, res) => {
		let ID = uuidv4();
		const data = {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			type: "CUSTOMER",
			uuid: ID,
			identifier: `CUSTOMER_${ID}`,
		};
		bcrypt.hash(req.body.password, 10, function (err, hash) {
			// Create User object with escaped and trimmed data
			const query = {};
			const projection = {_id: 1 };
			try {
				ExpertModel.find(query, projection).then((usersData) => {
					const users = usersData.map(item => item._id);
					var expertId = users[Math.floor(Math.random()*users.length)];
					var user = new UserModel({
						password: hash,
						allocatedTo: expertId,
						...data,
					});
					user.save(function (err) {
						if (err) {
							console.error(err);
						}
					});
					return apiResponse.successResponseWithData(res, "user information", user);
				});
		
			// eslint-disable-next-line no-empty
			} catch(err) {
				
			}

			

			
		});
	}
		
];