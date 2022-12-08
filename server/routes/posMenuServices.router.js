const express = require('express');
const controller = require('../controllers/posMenuServices.controller');
const router = express.Router();
const checkToken = require('../middlewares/secureRoutes');

// POS APIS
router.route('/getMenus').get(checkToken, controller.getPosMenus);
//router.route('/addMenus').post(checkToken, controller.addPosMenus);

module.exports = router