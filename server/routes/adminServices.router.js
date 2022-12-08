const express = require('express');
const controller = require('../controllers/adminServices.controller');
const checkToken = require('../middlewares/secureRoutes');
const router = express.Router();
const validate = require('express-validation');
const {editProfile} = require('../validations/ownerServices.validation');
const imageUpload = require('../middlewares/admin-uploadImage');
const restController = require('../controllers/restaurantServices.controller');
const addCatImage = require('../middlewares/admin-addCategoryImage');
const addItemImage = require('../middlewares/admin-addItemImage');
const uploadMenuImage = require('../middlewares/uploadMenuImage');

router.route('/addAdmin').post(controller.addAdmin);
router.route('/adminLogin').post(controller.adminLogin);
router.route('/resetPassword').post(checkToken, controller.resetPassword);
router.route('/addRestaurant').post(checkToken, controller.addRestaurant);
router.route('/getAllRestaurants').get(checkToken, controller.getAllRestaurants);
router.route('/getOrderGraphs/:id').get(checkToken, controller.getOrderGraphs);
router.route('/getDaysGraphs/:id').get(checkToken, controller.getDaysGraphs);
router.route('/getRestOwner/:id').get(checkToken, controller.getRestOwner);

router.route('/getRestItems/:id').get(checkToken, controller.getRestItems);
router.route('/getRestCategories/:id').get(checkToken, controller.getRestCategories);
router.route('/getRestToppingGroup/:id').get(checkToken, controller.getRestToppingGroup);
router.route('/getRestOption/:id').get(checkToken, controller.getRestOption);
router.route('/getRestTopping/:id').get(checkToken, controller.getRestTopping);

router.route('/addRestItem/:id').post(checkToken, addItemImage.single('file'), controller.addRestItem);
router.route('/updateRestItem/:id').put(checkToken, uploadMenuImage.single('file'), controller.updateRestItem);
router.route('/addRestTopping/:id').post(checkToken, controller.addRestTopping);
router.route('/addRestToppingGroup/:id').post(checkToken, controller.addRestToppingGroup);
router.route('/addRestOption/:id').post(checkToken, controller.addRestOption);

router.route('/addRestCategory/:id').post(checkToken, addCatImage.single('file'), controller.addRestCategory);
router.route('/deleteRestItem/:id').delete(checkToken, controller.deleteRestItem);
router.route('/deleteRestCategory/:id').delete(checkToken, controller.deleteRestCategory);
router.route('/deleteRestOption/:id').delete(checkToken, controller.deleteRestOption);
router.route('/deleteRestTopping/:id').delete(checkToken, controller.deleteRestTopping);

router.route('/deleteRestToppingGroup/:id').delete(checkToken, controller.deleteRestToppingGroup);
router.route('/updateRestCategory/:id').put(checkToken, uploadMenuImage.single('file'), controller.updateRestCategory);
router.route('/updateRestOption/:id').put(checkToken,controller.updateRestOption);
router.route('/updateRestTopping/:id').put(checkToken,controller.updateRestTopping);

router.route('/updateRestToppingGroup/:id').put(checkToken,controller.updateRestToppingGroup);
router.route('/addRestAllergy/:id').post(checkToken, controller.addRestAllergy);
router.route('/getRestAllergy/:id').get(checkToken, controller.getRestAllergy);
router.route('/deleteRestAllergy/:id').delete(checkToken, controller.deleteRestAllergy);

router.route('/updateRestAllergy/:id').put(checkToken,controller.updateRestAllergy);
router.route('/getRestAllergyGroup/:id').get(checkToken, controller.getRestAllergyGroup);
router.route('/addRestAllergyGroup/:id').post(checkToken, controller.addRestAllergyGroup);
router.route('/deleteRestAllergyGroup/:id').delete(checkToken, controller.deleteRestAllergyGroup);
router.route('/updateRestAllergyGroup/:id').put(checkToken,controller.updateRestAllergyGroup);

router.route('/restSetting/:id').put(checkToken,controller.restSetting);
router.route('/ownerEditProfile/:id').put(checkToken,controller.ownerEditProfile);
router.route('/updateRestaurantDiscount/:id').put(checkToken,controller.updateRestaurantDiscount);
router.route('/updateRestaurantStatus/:id').put(checkToken,controller.updateRestaurantStatus);
router.route('/addRestDistance/:id').post(checkToken, controller.addRestDistanceDetails);
router.route('/updateRestDistance/:id').post(checkToken, controller.updateRestDistanceDetails);
router.route('/deleteRestDistance/:id').post(checkToken, controller.deleteRestDistanceDetails);

router.route('/getRestVariants/:id').get(checkToken, controller.getRestVariants);
router.route('/addRestVariant/:id').post(checkToken, controller.addRestVariant);
router.route('/updateRestVariant/:id').put(checkToken, controller.updateRestVariant);
router.route('/deleteRestVariant/:id').delete(checkToken, controller.deleteRestVariant);
router.route('/getRestVariantGroups/:id').get(checkToken, controller.getRestVariantGroups);
router.route('/addRestVariantGroup/:id').post(checkToken, controller.addRestVariantGroup);
router.route('/updateRestVariantGroup/:id').put(checkToken, controller.updateRestVariantGroup);
router.route('/deleteRestVariantGroup/:id').delete(checkToken, controller.deleteRestVariantGroup);

router.route('/addRestImage/:id').put(checkToken, imageUpload.single('file'), restController.addRestaurantImage);

router.route('/getTimeSlots/:id').get(checkToken, controller.getTimeSlots);

module.exports = router;