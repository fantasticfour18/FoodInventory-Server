const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/orderServices.controller');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes');

router.route('/addOrder').post(checkToken,controller.addOrder);
router.route('/addTableOrder').post(controller.addTableOrder); // For Table QR order
router.route('/getOrders').get(checkToken,controller.getOrders);
router.route('/getTableOrders').get(checkToken, controller.getTableOrders); // For Table QR order
router.route('/getPendingTableOrder').get(controller.getTableOrders); // For Table QR order
router.route('/updateTableBillStatus').put(controller.updateTableBillStatus); // For Table QR order
router.route('/getOrder/:id').get(checkToken,controller.getOrder);
router.route('/getTableOrder/:id').get(checkToken,controller.getTableOrder); // For Table Order (single order)
router.route('/updateOrderStatus/:id').put(checkToken,controller.updateOrderStatus);
router.route('/updateTableOrderStatus/:id').put(checkToken,controller.updateTableOrderStatus); // For Table QR order
router.route('/currentOrder').get(checkToken,controller.getOrders);
router.route('/orderHistory').get(checkToken,controller.getOrderHistory);
router.route('/getReportData').get(checkToken, controller.getReportData);
router.route('/getTablesDetail').get(checkToken, controller.getTablesDetail);

// POS APIS
router.route('/getPosOrders/:id').get(checkToken, controller.getPosOrders);
//router.route('/orderStatus').post(checkToken);
//router.route()

// Strip Checkout (Singhs Restaurant)
router.route('/stripePaymentIntent').post(checkToken, controller.stripePaymentIntent);
router.route('/stripeCheckout').post(checkToken, controller.stripeCheckout);


module.exports = router;
