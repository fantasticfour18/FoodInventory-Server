const logger = require('../../config/logger');
const pushNoticeService = require('../service/pushNoticeServices');
const orderService = require('../service/orderServices');

const sendOrderNotification = (req, res, next) => {
	
	let restaurant = req.body;
	let userDetails = req.payLoad;
	
	logger.trace("Inside Push Notification Controller", restaurant, userDetails);

	// Get Latest Order
	let condition = {};
	condition.createdOn = {
		$gte: new Date(new Date(Date.now()).setUTCHours(0, 0, 0, 0)), 
		$lt: new Date(new Date(Date.now()).setUTCHours(23, 59, 59, 999))
	}
	condition.orderStatus = {$in:['PENDING','ACCEPTED']};

	// Send All Orders
	orderService.getOrders(condition).then(async (orders) => {
			
		delete condition.orderStatus;
        let summaryData = await orderService.getOrdersAnalysis(condition);
        io.sockets.in(restaurant.ownerId.email).emit("onOrderAdded", {"success":true, "data":orders,"summaryData":summaryData[0]});

		// Send Order Id Per User
		if(restaurant.orderId) {
			io.sockets.in(restaurant.ownerId.email).emit("onAutoPrintOrder", restaurant.orderId);
		}
	})
	.catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
	
	// Send Push Notification Bell
	pushNoticeService.sendOrderNotification(restaurant, userDetails).then(data => {
		
		res.status(200).json({"success":true, "data":data});
	})
	.catch(err => {
		
		logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	})
	
	//return res.status(200).json({"success": true});
	
}

module.exports = { sendOrderNotification }