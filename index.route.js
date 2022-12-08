const express = require('express');

const userServicesRoutes = require('./server/routes/userServices.router');
const ownerServicesRoutes = require('./server/routes/ownerServices.router');
const restaurantServicesRoutes = require('./server/routes/restaurantServices.router');
const menuServiceRoutes = require('./server/routes/menuServices.router');
const orderServiceRoutes = require('./server/routes/orderServices.router');
const pushNoticeServicesRoutes = require('./server/routes/pushNoticeServices.router');
const adminServiceRoutes = require('./server/routes/adminServices.router');
const posMenuServiceRoutes = require('./server/routes/posMenuServices.router');
const router = express.Router(); // eslint-disable-line new-cap
// let expressWs = require('express-ws')(router);


/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

router.use('/userService', userServicesRoutes);
router.use('/ownerService', ownerServicesRoutes);
router.use('/restaurantService', restaurantServicesRoutes);
router.use('/menuService', menuServiceRoutes);
router.use('/orderService', orderServiceRoutes);
router.use('/pushNoticeService', pushNoticeServicesRoutes)
router.use('/adminService', adminServiceRoutes);
router.use('/posMenuService', posMenuServiceRoutes);

module.exports = router;
