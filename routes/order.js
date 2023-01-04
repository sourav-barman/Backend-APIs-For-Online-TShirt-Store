const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");
const {
    createOrder,
    getOneOrder,
    getLoggedInOrders,
    admingetAllOrders,
    adminUpdateOrder,
    adminDeleteOrder
} = require("../controllers/orderController");

router.route("/order/create").post(isLoggedIn, createOrder);
router.route("/order/:id").get(isLoggedIn, getOneOrder);
router.route("/myorder").get(isLoggedIn, getLoggedInOrders);

router.route("/admin/orders").get(isLoggedIn, customRole("admin"), admingetAllOrders);
router.route("/admin/order/:id").put(isLoggedIn, customRole("admin"), adminUpdateOrder);
router.route("/admin/order/:id").delete(isLoggedIn, customRole("admin"), adminDeleteOrder);

module.exports = router;