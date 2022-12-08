const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/menuServices.controller');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes');
const imageUpload = require('../middlewares/uploadMenuImage');
const addCatImage = require('../middlewares/addCategoryImage');
const addItemImage = require('../middlewares/addItemImage');

// Toppings and Groups Routes
router.route('/addVariants').post(checkToken,controller.addVariant);
router.route('/getVariants').get(checkToken,controller.getVariants);
router.route('/getVariant/:id').get(checkToken,controller.getVariant);
router.route('/updateVariant/:id').put(checkToken,controller.updateVariant);
router.route('/deleteVariant/:id').delete(checkToken,controller.deleteVariant);

router.route('/addVariantGroups').post(checkToken,controller.addVariantGroup);
router.route('/getVariantGroups').get(checkToken,controller.getVariantGroups);
router.route('/getVariantGroup/:id').get(checkToken,controller.getVariantGroup);
router.route('/updateVariantGroup/:id').put(checkToken,controller.updateVariantGroup);
router.route('/deleteVariantGroup/:id').delete(checkToken,controller.deleteVariantGroup);

// Toppings and Groups Routes
router.route('/addToppings').post(checkToken,controller.addTopping);
router.route('/getToppings').get(checkToken,controller.getToppings);
router.route('/getTopping/:id').get(checkToken,controller.getTopping);
router.route('/updateTopping/:id').put(checkToken,controller.updateTopping);
router.route('/deleteTopping/:id').delete(checkToken,controller.deleteTopping);

router.route('/addToppingGroups').post(checkToken,controller.addToppingGroup);
router.route('/getToppingGroups').get(checkToken,controller.getToppingGroups);
router.route('/getToppingGroup/:id').get(checkToken,controller.getToppingGroup);
router.route('/updateToppingGroup/:id').put(checkToken,controller.updateToppingGroup);
router.route('/deleteToppingGroup/:id').delete(checkToken,controller.deleteToppingGroup);

// Allergies and Groups Routes
router.route('/addAllergy').post(checkToken,controller.addAllergy);
router.route('/getAllergies').get(checkToken,controller.getAllergies);
router.route('/getAllergy/:id').get(checkToken,controller.getAllergy);
router.route('/updateAllergy/:id').post(checkToken,controller.updateAllergy);
router.route('/deleteAllergy/:id').delete(checkToken,controller.deleteAllergy);

router.route('/addAllergyGroup').post(checkToken,controller.addAllergyGroup);
router.route('/getAllergyGroups').get(checkToken,controller.getAllergyGroups);
router.route('/getAllergyGroup/:id').get(checkToken,controller.getAllergyGroup);
router.route('/updateAllergyGroup/:id').post(checkToken,controller.updateAllergyGroup);
router.route('/deleteAllergyGroup/:id').delete(checkToken,controller.deleteAllergyGroup);

// Options Routes
router.route('/addOptions').post(checkToken,controller.addOption);
router.route('/getOptions').get(checkToken,controller.getOptions);
router.route('/getOption/:id').get(checkToken,controller.getOption);
router.route('/updateOption/:id').put(checkToken,controller.updateOption);
router.route('/deleteOption/:id').delete(checkToken,controller.deleteOption);

// Categories Routes
router.route('/addCategories').post(checkToken,addCatImage.single('file'),controller.addCategory);
router.route('/getCategories').get(checkToken,controller.getCategories);
router.route('/getCategory/:id').get(checkToken,controller.getCategory);
router.route('/updateCategory/:id').put(checkToken,imageUpload.single('file'),controller.updateCategory);
router.route('/deleteCategory/:id').delete(checkToken,controller.deleteCategory);
router.route('/updateCategoryPosition').post(checkToken, controller.updateCategoryPosition);

// Items Routes
router.route('/addItems').post(checkToken,addItemImage.single('file'),controller.addItem);
router.route('/getItems').get(checkToken,controller.getItems);
router.route('/getItem/:id').get(checkToken,controller.getItem);
router.route('/updateItem/:id').put(checkToken,imageUpload.single('file'),controller.updateItem);
router.route('/deleteItem/:id').delete(checkToken,controller.deleteItem);
router.route('/updateItemPosition').post(checkToken, controller.updateItemPosition);
router.route('/updateItemDiscountStatus').post(checkToken, controller.updateItemDiscount);

/* router.route('/addMenuImage').put(checkToken, imageUpload.single('file'), controller.updateMenuImage); */
router.route('/downloadMenuImage').get(controller.downloadMenuImage);

router.route('/homeMenu/:id').get(controller.getItemsForHomePage);

module.exports = router;