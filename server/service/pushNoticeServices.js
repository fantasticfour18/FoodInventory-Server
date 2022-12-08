const logger = require('../../config/logger');
const models = require('../../models');
const mongoose = require('mongoose');
const fireAdmin = require("firebase-admin");
const serviceAccount = require("../../config/firebaseKey/foodInventoryNew.json");

fireAdmin.initializeApp({
  credential: fireAdmin.credential.cert(serviceAccount)
});

const sendOrderNotification = (restaurant, userDetails) => {
	return new Promise(async (resolve, reject) => {
		logger.trace('Inside Push Notification Services');
		
		try {	
			
			let owner = await models.owner.findOne({restaurantId: restaurant.restaurantId}, {deviceToken: 1, _id: 0});
			let deviceId = owner.deviceToken;
			
			const message = {
				notification: {title: 'New Order', body: 'You have new order #' + restaurant.orderNumber}
			}
	
			fireAdmin.messaging().sendToDevice(deviceId, message).then(response => {
				logger.trace(response);
				resolve(response);
			})
			.catch(err => {
				logger.trace(err);
				reject(err);
			})
			
		}
		catch(err) {
			logger.fatal(err);
			reject({ code:422, message: err.message })
		}
	})
}

module.exports = { sendOrderNotification }