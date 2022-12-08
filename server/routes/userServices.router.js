const express = require('express');
const validate = require('express-validation');
// const activityLogger = require('../middlewares/activityLogger')
const controller = require('../controllers/userServices.controller');
const {login} = require('../validations/userServices.validation');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes');


router.route('/sendOTP').post(controller.sendOTP);
router.route('/verifyOTP').post(controller.verifyOTP);
/* router.route('/login').post(validate(login),controller.userLogin); */
router.route('/registerUser').post(controller.registerUser);
router.route('/addUser').post(controller.addUser);
router.route('/validatePassCode').get(controller.validatePassCode);
router.route('/bookReservation').post(controller.bookReservation);
router.route('/getHomeRestaurants').post(controller.getHomeRestaurants);
router.route('/getFilteredRests').post(controller.getFilteredRests);

module.exports = router;
