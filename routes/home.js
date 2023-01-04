const express = require("express");
const router = express.Router();

const { home, homeDummy } = require("../controllers/homeController");

router.route("/").get(home);

module.exports = router;