var express = require("express");
var AuthController = require("../controllers/AuthController");
var CustomerController = require("../controllers/CustomerController");
var ExpertController = require("../controllers/ExpertController");
var router = express.Router();

router.post("/login", AuthController.sso);
router.post("/signUp", AuthController.signUp);
router.get("/userInfo", CustomerController.getInfo);
router.post("/completeJob", ExpertController.completeJob);
router.get("/joblist", ExpertController.getInfo);

module.exports = router;