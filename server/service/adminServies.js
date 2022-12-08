const logger = require('../../config/logger');
const models = require('../../models');
const moment = require('moment');

const getAdmin = () => {
	return new Promise(async (resolve, reject) => {
		try
		{
			const admin = await models.admin.findOne({}, {email: 1});
			resolve(admin.email);
		}
		catch(err)
		{
			logger.fatal(err);
			reject({ code:401, message: err.message })
		}
	})
}

const addAdmin = (admin) => {
	return new Promise(async (resolve, reject) => {
		try
		{
			logger.trace("inside add owner service", admin);
            
			await models.admin.insertMany(
                [admin]
            );
			
            return resolve("admin added successfully...");
		}
		catch(err)
		{
			logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:401, message: err.message });
		}
	})
	
}

const adminLogin = (admin) => {

    return new Promise(async (resolve, reject) => {
        try 
        {
            let adminData = await models.admin.findOne(
                {email: admin.email},
                {__v: 0} 
            );

            if(adminData)
            {
                if(admin.password == adminData.password) {   
                    resolve(adminData);
                }
                else {
                    reject(new Error('Invalid Email or Password'));
                }
            }
            else {
                reject(new Error('Invalid Email or Password'));
            }
        }
        catch(err)
        {   
            logger.fatal(err)
            reject({code: 401, msg: err});
        }
    })

}
const addRestaurant = (restaurantProfile) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add restaurant service",{restaurantProfile});
            let restaurant = await models.restaurant.insertMany(
                [restaurantProfile]
            );
			
            return resolve(restaurant[0]._id);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
			}
            reject({ code:401, message: err.message });
		}
	})
}

const addOwner = (ownerData, restId) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add owner service",{ownerData});
            let owner = await models.owner.insertMany(
                [ownerData]
            );
            return resolve(owner[0]._id);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
				//Delete Restaurant if Owner's duplicate email id found..
				await models.restaurant.deleteOne({_id: restId});
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:401, message: err.message });
        }
    })
}

const updateRestaurantOwner = (restaurant, owner) => {
	return new Promise(async (resolve, reject) => {
		try {
			logger.trace("inside update restaurant owner service...", {restaurant, owner});
			
			let rest = await models.owner.findOneAndUpdate(
				{_id: owner},
				{$set: {restaurantId: restaurant}}
			);
			
			let ownerResult = await models.restaurant.findOneAndUpdate(
				{_id: restaurant},
				{$set: {ownerId: owner}}
			);

			if(rest && ownerResult) 
			{
				await models.sequenceCounter.insertMany([
					{
						"restaurantId": restaurant,
						"group": "categories",
						"sequence": 0 
					},
					{
						"restaurantId": restaurant,
						"group": "items",
						"sequence": 0
					}]);
			}
			
			resolve({"msg1": "Restaurant and Owner Added Successfully", "msg2": 'restaurant owner relationship updated successfully...'});
		}
		catch(err) {
			logger.fatal(err);
			reject({ code:401, message: err.message });
		}
	})
	
}

const getAllRestaurants = () => {
	
	return new Promise(async (resolve, reject) => {
		try
		{
			let restaurants = await models.restaurant.find({}, {ownerId: 0});
			
			logger.info(restaurants);
			
			resolve(restaurants);
		}
		catch(err)
		{
			logger.fatal(err)
            reject({code: 401, msg: err});
		}
	})
	
}


const getOrderGraphs = (id) => {

	return new Promise(async (resolve, reject) => {
		try
		{
			let year = moment().format('YYYY')
			let months = [
				{mon: year+"01", totalOrders: 0}, {mon: year+"02", totalOrders: 0}, {mon: year+"03", totalOrders: 0},
				{mon: year+"04", totalOrders: 0}, {mon: year+"05", totalOrders: 0}, {mon: year+"06", totalOrders: 0},
				{mon: year+"07", totalOrders: 0}, {mon: year+"08", totalOrders: 0}, {mon: year+"09", totalOrders: 0},
				{mon: year+"10", totalOrders: 0}, {mon: year+"11", totalOrders: 0}, {mon: year+"12", totalOrders: 0},
			];

			let months2 = [
				{mon: year+"01", totalOrders: 0}, {mon: year+"02", totalOrders: 0}, {mon: year+"03", totalOrders: 0},
				{mon: year+"04", totalOrders: 0}, {mon: year+"05", totalOrders: 0}, {mon: year+"06", totalOrders: 0},
				{mon: year+"07", totalOrders: 0}, {mon: year+"08", totalOrders: 0}, {mon: year+"09", totalOrders: 0},
				{mon: year+"10", totalOrders: 0}, {mon: year+"11", totalOrders: 0}, {mon: year+"12", totalOrders: 0},
			];

			let months3 = [
				{mon: year+"01", totalSales: 0}, {mon: year+"02", totalSales: 0}, {mon: year+"03", totalSales: 0},
				{mon: year+"04", totalSales: 0}, {mon: year+"05", totalSales: 0}, {mon: year+"06", totalSales: 0},
				{mon: year+"07", totalSales: 0}, {mon: year+"08", totalSales: 0}, {mon: year+"09", totalSales: 0},
				{mon: year+"10", totalSales: 0}, {mon: year+"11", totalSales: 0}, {mon: year+"12", totalSales: 0},
			];

			let totalOrders = await getOrderslist(id, 'ACCEPTED', 0,6);
			
			
			logger.info('group result...', totalOrders);
			
			for await (let month of totalOrders)
			{
				if(months.some(m => month._id == m.mon)) 
				{
					logger.info('found...', month._id);
					let index = months.findIndex((monthIndex) => {
						return monthIndex.mon == month._id;
					})
					
					logger.info('Months index...', index);
					months[index].totalOrders = month.totalOrders;
				}
			}


			let totalDeclined = await  getOrderslist(id, 'DENIED', 0,6);

			
			logger.info('group result...', totalDeclined);
			
			for await (let month of totalDeclined)
			{
				if(months2.some(m => month._id == m.mon)) 
				{
					logger.info('found...', month._id);
					let index = months2.findIndex((monthIndex) => {
						return monthIndex.mon == month._id;
					})
					
					logger.info('Months index...', index);
					months2[index].totalOrders = month.totalOrders;
				}
			}


			let totalSales = await getSaleslist(id, 'ACCEPTED', 0,6);

			
			logger.info('group result...', totalSales);
			
			for await (let month of totalSales)
			{
				if(months3.some(m => month._id == m.mon)) 
				{
					logger.info('found...', month._id);
					let index = months3.findIndex((monthIndex) => {
						return monthIndex.mon == month._id;
					})
					
					logger.info('Months index...', index);
					months3[index].totalSales = month.totalSales;
				}
			}


			
			resolve({totalAccepted: months, totalDenied: months2, totalSales: months3});
		}
		catch(err)
		{
			logger.fatal(err);
			reject({code: 401, msg: err});
		}
	})
	
}



const getOrderslist = (restId, orderStatus,startIndex, endIndex) => {
	return new Promise(async(resolve, reject) => {

		try
		{

		let totalOrders = await models.order.aggregate([
			{$match: {restaurantId: restId, orderStatus: orderStatus}
			},
			{$group:
				{
				_id: {$substr: ["$orderNumber", startIndex, endIndex]},
				totalOrders: { $sum: 1}
				
				}}
			])

			resolve(totalOrders);
		}
		catch(err)
		{
			logger.trace(err);
			reject({msg: err.msg})
		}
	})
}

const getSaleslist = (restId, orderStatus,startIndex, endIndex) => {
	return new Promise(async(resolve, reject) => {

		try
		{

		let totalSale = await models.order.aggregate([
			{$match: {restaurantId: restId, orderStatus: orderStatus}
			},
			{$group:
				{
				_id: {$substr: ["$orderNumber",startIndex, endIndex]},
				totalSales: { $sum: "$totalAmount"}
				
				}}
			])

			resolve(totalSale);
		}
		catch(err)
		{
			logger.trace(err);
			reject({msg: err.msg})
		}
	})
}

const getDaysGraphs = (id) => {

	return new Promise(async (resolve, reject) => {
		try
		{
			let year = moment().format('YYYY')
			let daysCount = moment().daysInMonth();
			let days = [], days1 =[], days2 = [];

			for(let day = 1; day <= daysCount; day++)
			{
				days.push({dates: year+"10"+day, totalOrders: 0})
				days1.push({dates: year+"10"+day, totalOrders: 0})
				days2.push({dates: year+"10"+day, totalSales: 0})
			}

			let totalOrders = await getOrderslist(id, 'ACCEPTED', 0, 8);
			
			
			logger.info('group result...', totalOrders);
			
			for await (let day of totalOrders)
			{
				if(days.some(d => day._id == d.dates)) 
				{
					logger.info('found...', day._id);
					let index = days.findIndex((dayIndex) => {
						return dayIndex.dates == day._id;
					})
					
					logger.info('Days index...', index);
					days[index].totalOrders = day.totalOrders;
				}
			}

			let totalDeclined = await  getOrderslist(id, 'DENIED', 0,8);

			
			logger.info('group result...', totalDeclined);
			
			for await (let day of totalDeclined)
			{
				if(days1.some(d => day._id == d.dates)) 
				{
					logger.info('found...', day._id);
					let index = days1.findIndex((dayIndex) => {
						return dayIndex.dates == day._id;
					})
					
					logger.info('Days index...', index);
					days1[index].totalOrders = day.totalOrders;
				}
			}

			let totalSales = await getSaleslist(id, 'ACCEPTED', 0,8);

			
			logger.info('group result...', totalSales);
			
			for await (let day of totalSales)
			{
				if(days2.some(d => day._id == d.dates)) 
				{
					logger.info('found...', day._id);
					let index = days2.findIndex((dayIndex) => {
						return dayIndex.dates == day._id;
					})
					
					logger.info('days index...', index);
					days2[index].totalSales = day.totalSales;
				}
			}


			resolve({totalAccepted: days, totalDenied: days1, totalSales: days2});
		}
		catch(err)
		{
			logger.fatal(err);
			reject({code: 401, msg: err});
		}
	})
	
}

const getOrderAnalysis = (condition = {}, restaurantIds) => {
	return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders analysis service");
            let orders = await models.order.aggregate([
                {$match:condition},
                {
                    $group: { 
                        _id: "$restaurantId",
                        acceptedOrder: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "ACCEPTED" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        declinedOrder: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "DENIED" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        pendingOrder: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "PENDING" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        orderRecieved:{$sum: 1},
                        onlineOrderAmount: {
                            $sum: {
                                "$cond": {
                                    "if": { $and : [ { "$eq": [ "$paymentMode", "online" ] },
                                            { "$eq": [ "$orderStatus", "ACCEPTED" ] },
                                        ] 
                                    },
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                        cashOrderAmount: {
                            $sum: {
                                "$cond": {
                                    "if": { $and : [ { "$eq": [ "$paymentMode", "Barzahlung" ] },
                                            { "$eq": [ "$orderStatus", "ACCEPTED" ] },
                                        ]
                                    },
                                    "then": {$sum: "$totalAmount" },
                                    "else": {}
                                }
                            }
                        },
                        totalOrderAmount: { $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$orderStatus", "ACCEPTED" ] }, 
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                    }
                },
            ]);
        
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    });
}

const resetPassword = (email, pass) => {

	return new Promise (async (resolve, reject) => {

		try
		{
			let owners = await models.owner.findOneAndUpdate(
				{email: email},
				{$set: {password: pass}});

			if(owners) {
				resolve('Password reset successfully...');
			}
			
		}
		catch(err) 
		{
			logger.fatal(err);
			reject({code: 401, msg: err});
		}
	})
}

const getRestOwner = (restId) => {

	return new Promise (async (resolve, reject) => {

		try
		{
			let owners = await models.owner.find({restaurantId: restId}, {email: 1, _id: 0});

			resolve(owners);
		}
		catch(err) 
		{
			logger.fatal(err);
			reject({code: 401, msg: err});
		}
	})
}

module.exports = {
	getAdmin,
	addAdmin,
    adminLogin, 
    addRestaurant,
	updateRestaurantOwner,
	addOwner,
	getAllRestaurants,
	getOrderGraphs,
	getDaysGraphs,
	getRestOwner,
	getOrderAnalysis,
	resetPassword
}