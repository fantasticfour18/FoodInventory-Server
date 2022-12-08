const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/restaurantServices.controller');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes');
const imageUpload = require('../middlewares/uploadImage');

router.route('/addRestaurant').post(checkToken,controller.addRestaurantProfile);
router.route('/profile/:id').get(controller.getRestaurantProfile);
router.route('/instanceAction/:status').put(checkToken,controller.updateRestaurantStatus);
router.route('/updateDiscount').put(checkToken,controller.updateRestaurantDiscount);
router.route('/updatePasscode').put(checkToken,controller.updateRestaurantPasscode);
router.route('/addRestaurantImage').put(checkToken,imageUpload.single('file'),controller.addRestaurantImage);
router.route('/downloadRestaurantImage').get(controller.downloadRestaurantImage);
router.route('/getRestaurantImage').get(controller.getRestaurantImage);
router.route('/restaurantSetting').put(checkToken,controller.restaurantSetting);
router.route('/addRestDistance').post(checkToken, controller.addRestDistance);
router.route('/updateRestDistance').post(checkToken, controller.updateRestDistance);
router.route('/deleteRestDistance').post(checkToken, controller.deleteRestDistance);

router.route('/getTimeZones').get(checkToken, controller.getTimeZones);
router.route('/getMenuTimezones').get(controller.getTimeZones); // For FrontEnd Only
router.route('/addTimeZone').post(checkToken, controller.addTimeZone);
router.route('/updateTimeZone').post(checkToken, controller.updateTimeZone);
router.route('/updateTimeZoneStatus').post(checkToken, controller.updateTimeZoneStatus);
router.route('/deleteTimeZone').post(checkToken, controller.deleteTimeZone);

router.route('/getTimeSlots').get(checkToken, controller.getTimeSlots);
router.route('/addTimeSlot').post(checkToken, controller.addTimeSlot);
router.route('/updateTimeSlot').post(checkToken, controller.updateTimeSlot);
router.route('/updateTimeSlotStatus').post(checkToken, controller.updateTimeSlotStatus);
router.route('/deleteTimeSlot').post(checkToken, controller.deleteTimeSlot);
router.route('/updateOnlineOrdering').put(checkToken, controller.updateOnlineOrdering);
router.route('/getCategoryPrinters').get(checkToken, controller.getCategoryPrinters);
router.route('/updateCategoryPrinters').post(checkToken, controller.updateCategoryPrinters);
router.route('/updateRestTable').post(checkToken, controller.updateRestTable);
router.route('/deleteRestTable/:table').delete(checkToken, controller.deleteRestTable);

module.exports = router;