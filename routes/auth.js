var express = require("express");
const AuthController = require("../controllers/AuthController");

var router = express.Router();

router.post("/bulk-expert", AuthController.bulkExperts);
router.post("/bulk-task", AuthController.bulkTasks);
router.get("/bulk-user", AuthController.bulkUsers);

module.exports = router;