const express = require('express');
const controller = require('../controllers/pushNoticeServices.controller');
const checkToken = require('../middlewares/secureRoutes');
const router = express.Router();

router.route('/sendOrderNotification').post(checkToken, controller.sendOrderNotification)

module.exports = router;