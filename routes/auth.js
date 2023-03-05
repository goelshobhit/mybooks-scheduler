var express = require("express");
const AuthController = require("../controllers/AuthController");

var router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/users", AuthController.getUsers);
router.post("/users/mailRegister", AuthController.mailRegister);
router.post("/sendEmailToUser", AuthController.sendEmailToUser);
router.post("/bulk-expert", AuthController.bulkExperts);
router.post("/bulk-task", AuthController.bulkTasks);
router.get("/bulk-user", AuthController.bulkUsers);

module.exports = router;