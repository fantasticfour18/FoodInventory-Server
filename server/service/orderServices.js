const logger = require('../../config/logger');
const models = require('../../models');
const mongoose = require('mongoose');
const moment = require('moment');

const getOrderNumber = (id, orderType="Pick & Del") =>{
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get order number service");
            let lastOrder; 
            if(orderType == "Pick & Del")
            {
                lastOrder = await models.order.findOne(
                    {restaurantId: id},
                    {
                        orderNumber:1
                    }
                ).limit(1).sort({$natural:-1});  
            }
            else 
            {
                lastOrder = await models.tableOrder.findOne(
                    {restaurantId: id},
                    {
                        orderNumber:1
                    }
                ).limit(1).sort({$natural:-1});
            }

            logger.debug(lastOrder);
            let uniqueLastDigit = "001";
            let currentDate = new Date();
            let currentMonth = currentDate.getMonth()+1;
			let date = currentDate.getDate();
			let currentTime = currentDate.getHours()+""+currentDate.getMinutes()+""+currentDate.getSeconds()+""+currentDate.getMilliseconds();
            currentMonth = (currentMonth > 9)?(currentMonth.toString()):("0"+(currentMonth.toString()));
			date = (date > 9)?(date.toString()):("0"+(date.toString()));
            let currentYear = currentDate.getFullYear().toString();
            let newUniqueOrderNo = currentYear+currentMonth+date+currentTime+uniqueLastDigit;
            if(lastOrder){
                let lastOrderNo = lastOrder.orderNumber;
                let lastMonth = lastOrderNo.slice(4,6);
                if(currentMonth == lastMonth){
                    uniqueLastDigit = ("000" + (parseInt(lastOrderNo.slice(-3))+1).toString()).slice(-3);
                }
                newUniqueOrderNo = currentYear+currentMonth+date+currentTime+uniqueLastDigit;
                logger.debug(currentDate,currentMonth,currentYear,currentTime,{uniqueLastDigit,lastMonth,newUniqueOrderNo})
            }
            resolve(newUniqueOrderNo);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const validateItems = (itemDetails) =>{
    return new Promise(async (resolve, reject) => {
        try {
            let itemIds = {};
            await itemDetails.forEach(item=>{
                itemIds[item._id] = 1;
            })
            logger.debug({itemIds});
            itemIds = Object.keys(itemIds);
            let foundItems = await models.item.find({ _id:itemIds});
            if(foundItems.length != itemIds.length){
                reject({ code:422, message: "invalid item found" });
            }
            resolve();
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}


const addOrder = (orderDetails,userDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add order service",{orderDetails,userDetails});

            var flag = 0;
            var owner = await models.owner.findOne(
                        {restaurantId: orderDetails.restaurantId},
                        {email: 1, _id: 0});
			
			if(orderDetails.deliveryType == 'DELIVERY') 
			{
				await models.user.findOneAndUpdate({email: userDetails.email}, 
				{$set: { houseNumber: orderDetails.houseNumber, street: orderDetails.street, city: orderDetails.city,  
                        address: orderDetails.address, postcode: orderDetails.postcode} },
				{ projection: {_id:0,__v:0,password:0}});
			}
			/* else if(orderDetails.deliveryType == 'PICKUP')
			{
				await models.user.findOneAndUpdate({email: userDetails.email}, 
				{$set: {contact: orderDetails.contact}},
				{ projection: {_id:0,__v:0,password:0}});
			} */
			
            let allObj = await Promise.all([
                getOrderNumber(orderDetails.restaurantId),
                models.user.findOne({email:userDetails.email},{_id:0,__v:0,password:0,otp:0}),
                validateItems(orderDetails.itemDetails),
                models.order.startSession()
            ]);
            logger.debug(allObj);
            orderDetails.orderNumber = allObj[0];
            orderDetails.userDetails = allObj[1];
			orderDetails.orderDateTime = moment().format('MM/DD/YYYY hh:mm:ss A');
            orderDetails.createdOn = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
            var session = allObj[allObj.length - 1];
            await session.startTransaction();
            flag = 1;
            let order = await models.order.insertMany([orderDetails],{ session });
            await session.commitTransaction();
            // await session.abortTransaction();
			
            return resolve({msg: "Order added successfully...", owner: owner, orderId: order[0]._id, orderNumber: orderDetails.orderNumber});
        }
        catch (err) {
            logger.fatal(err);
            if(flag){
                await session.abortTransaction();
            }
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

// For Table QR Order
const addTableOrder = (orderDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add order service",{orderDetails});

            var flag = 0;
            var owner = await models.owner.findOne(
                        {restaurantId: orderDetails.restaurantId},
                        {email: 1, _id: 0});
            
            logger.debug(owner);

            if(!orderDetails.isPrevOrder) {
                orderDetails.orderNumber = await getOrderNumber(orderDetails.restaurantId, "Table QR");
                orderDetails.orderDateTime = moment().format('MM/DD/YYYY hh:mm:ss A');
                orderDetails.createdOn = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
            }
            var session = await models.tableOrder.startSession();
            session.startTransaction();

            flag = 1;
            let order, orderId, isOrderAdded; 
            if(!orderDetails.isPrevOrder) 
            {
                order = await models.tableOrder.insertMany([orderDetails],{ session });
                orderId = order[0]._id;
                isOrderAdded = true;

                // Update Table Status
                await models.restaurant.updateOne(
                    {_id: orderDetails.restaurantId, "tableDetails.table": parseInt(orderDetails.tableNumber)},
                    {
                        $set: {
                            "tableDetails.$.status": "TAKEN"
                        }
                    }
                );
            }
            else 
            {
                orderDetails.repeatOrder = true;
                orderDetails.createdOn = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
                order = await models.tableOrder.findOneAndUpdate(
                    {restaurantId: orderDetails.restaurantId, orderStatus: "PENDING", tableNumber: orderDetails.tableNumber},
                    orderDetails,
                    {returnOriginal: false}
                )
                orderId = order._id;
                orderDetails.orderNumber = order.orderNumber;
                isOrderAdded = false;
            }
            await session.commitTransaction();
			
            return resolve({msg: "Order added successfully...", owner: owner, orderId: orderId, 
                            orderNumber: orderDetails.orderNumber, isOrderAdded: isOrderAdded});
        }
        catch (err) {
            logger.fatal(err);
            if(flag){
                await session.abortTransaction();
            }
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const getOrders = (condition = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders service");
            let orders = await models.order.aggregate([
                {$match:condition},
                {$sort:{_id:-1}}
            ]);
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

// For Table QR Order
const getTableOrders = (condition = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get table orders service");
            let orders = await models.tableOrder.aggregate([
                {$match:condition},
                {$sort:{createdOn:-1}}
            ]);
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOrdersAnalysis = (condition = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders analysis service");
            let orders = await models.order.aggregate([
                {$match:condition},
                {
                    $group: { 
                        _id: {$dateToString: { format: "%Y-%m-%d", date: "$createdOn"} },
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
                        orderReceived:{$sum: 1},
                        onlineOrderAmount: {
                            $sum: {
                                "$cond": {
                                    "if": { $and : [ { "$eq": [ "$paymentMode", "Online" ] },
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
                                    "if": { $and : [ { "$eq": [ "$paymentMode", "Barzahlung" ] }, //Switch to Barzahlung (GER) or Cash (UK)
                                            { "$eq": [ "$orderStatus", "ACCEPTED" ] },
                                        ]
                                    },
                                    "then": {$sum: "$totalAmount"},
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
            defaultOrder = {
                "_id": 0,
                "acceptedOrder": 0,
                "declinedOrder": 0,
                "pendingOrder": 0,
                "orderReceived": 0,
                "onlineOrderAmount": 0,
                "cashOrderAmount": 0,
                "totalOrderAmount": 0
            }

            if(orders.length) {
                for await (let order of orders)
                {
                    order["onlineOrderAmount"] = parseFloat(order.onlineOrderAmount.toFixed(2));
                    order["cashOrderAmount"] = parseFloat(order.cashOrderAmount.toFixed(2));
                    order["totalOrderAmount"] = parseFloat(order.totalOrderAmount.toFixed(2)); 
                }
            }
            orders = orders.length?orders:[defaultOrder];
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getTableOrdersAnalysis = (condition = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders analysis service");
            let orders = await models.order.aggregate([
                {$match:condition},
                {
                    $group: { 
                        _id: {$dateToString: { format: "%Y-%m-%d", date: "$createdOn"} },
                        totalOrders: {$sum: 1},
                        totalOrderAmount: {$sum: "$totalAmount"} 
                        },
                }
            ]);

            defaultOrder = {
                "_id": 0,
                "totalOrders": 0,
                "totalOrderAmount": 0
            }

            if(orders.length) {
                for await (let order of orders) {
                    order["totalOrderAmount"] = parseFloat(order.totalOrderAmount.toFixed(2)); 
                }
            }
            orders = orders.length?orders:[defaultOrder];
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOrderPerUser = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get orders per user service");
            let orders = await models.order.find(
                {
                    "userDetails.email":userEmail
                },
                {
                    __v:0
                }
            ).sort({"_id":-1});
            resolve(orders);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOrder = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get order by id service");
            let order = await models.order.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(order);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getTableOrder = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get table order by id service");
            let order = await models.tableOrder.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(order);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateOrderStatus = (_id,orderStatus,restId) =>{
    return new Promise(async (resolve, reject) => {
        logger.trace("inside update order status",{_id,orderStatus });
        try
        {
            // Get Restaurant Email for sending emails
            let restData = await models.restaurant.findOne({_id: restId}, 
                {restEmail: 1, _id: 0, restaurantName: 1, location: 1, phoneNumber: 1});

            let order = await models.order.findOneAndUpdate(
                {_id},
                {orderStatus},
                {returnOriginal: false}
            );
            resolve({order: order, restData: restData});
        }
        catch(err){
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateTableOrderStatus = (_id,orderStatus,restId) =>{
    return new Promise(async (resolve, reject) => {
        logger.trace("inside update table order status",{_id,orderStatus });
        try
        {
            // Get Restaurant Email for sending emails
            let restData = await models.restaurant.findOne({_id: restId}, {restEmail: 1, _id: 0});

            let order = await models.tableOrder.findOneAndUpdate(
                {_id},
                {orderStatus},
                {returnOriginal: false}
            );

            // Update Table Status
            await models.restaurant.updateOne(
                {_id: restId, "tableDetails.table": parseInt(order.tableNumber)},
                {
                    $set: {
                        "tableDetails.$.status": "VACANT"
                    }
                }
            );

            resolve({order: order, restEmail: restData.restEmail});
        }
        catch(err){
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateTableBillStatus = (restId, tableNumber) => {
    return new Promise(async (resolve, reject) => {
        logger.trace("inside update table bill status");
        try
        {
            // Get Restaurant Email for sending emails
            let owner = await models.owner.findOne(
                {restaurantId: restId},
                {email: 1, _id: 0});

            let order = await models.tableOrder.findOneAndUpdate(
                {restaurantId: restId, orderStatus: "PENDING", tableNumber: tableNumber},
                {$set: {isPaid: true, orderStatus: "PAYING"}},
                {returnOriginal: false}
            )
            resolve({order: order, owner: owner});
        }
        catch(err){
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

// For POS Orders
const getPosOrders = (id) => {
    return new Promise(async (resolve, reject) => {
        logger.info("inside get POS order service");
        
        let condition = {
            restaurantId: id,
        }
        condition.createdOn = {
            $gte: new Date(new Date(Date.now()).setUTCHours(0, 0, 0, 0)), 
            $lt: new Date(new Date(Date.now()).setUTCHours(23, 59, 59, 999))
        }
        condition.orderStatus = {$in:['PENDING','ACCEPTED', 'DENIED']};

        try
        {
            const order = await models.order.find(
                condition
            )
            resolve(order);
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getReportData = (reportType, condition) => {
    return new Promise(async (resolve, reject) => {
        try 
        {
            logger.trace("inside get report data service");
            let orders = await models.order.aggregate([
                {$match:condition},
                {$sort:{createdOn:1}}
            ]);

            let restaurant = await models.restaurant.findOne(
                {_id: condition.restaurantId}, 
                {restaurantName: 1, location: 1, printerPortType: 1, wifiPrinterIP: 1, usbPrinterName: 1, printCopies: 1, _id: 0}
            );

            resolve({orders: orders, restaurantDetails: restaurant});
        }
        catch (err) 
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getReportSummary = (condition = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get report summary service");

            let orders = await models.order.aggregate([
                {$match:condition},
                {
                    $group: { 
                        _id: {$dateToString: { format: "%Y-%m-%d", date: "$createdOn"}},
                        pickupOrders: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$deliveryType", "PICKUP" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        deliveryOrders: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$deliveryType", "DELIVERY" ] }, 
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        totalPickupSales: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$deliveryType", "PICKUP" ]},
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                        totalDeliverySales: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$deliveryType", "DELIVERY" ]},
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                        totalOnlinePayment: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$paymentMode", "Online" ] },
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                        totalCashPayment: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$paymentMode", "Barzahlung" ] }, //Switch to Barzahlung (GER) or Cash (UK)
                                    "then": {$sum: "$totalAmount"},
                                    "else": {}
                                }
                            }
                        },
                        totalOrders: {$sum: 1},
                        totalOnlineCount: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$paymentMode", "Online" ] },
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        totalCashCount: {
                            $sum: {
                                "$cond": {
                                    "if": { "$eq": [ "$paymentMode", "Barzahlung" ] },
                                    "then": {$sum: 1},
                                    "else": {}
                                }
                            }
                        },
                        totalSales: {$sum: "$totalAmount"}
                    }
                }
            ]);

            defaultOrder = {
                "_id": 0,
                "pickupOrders": 0,
                "deliveryOrders": 0,
                "totalPickupSales": 0,
                "totalDeliverySales": 0,
                "totalOnlinePayment": 0,
                "totalCashPayment": 0,
                "totalOrders": 0,
                "totalOnlineCount": 0,
                "totalCashCount": 0,
                "totalSales": 0
            }

            if(orders.length) {
                for await (let order of orders)
                {
                    order["totalPickupSales"] = parseFloat(order.totalPickupSales.toFixed(2));
                    order["totalDeliverySales"] = parseFloat(order.totalDeliverySales.toFixed(2));
                    order["totalOnlinePayment"] = parseFloat(order.totalOnlinePayment.toFixed(2));
                    order["totalCashPayment"] = parseFloat(order.totalCashPayment.toFixed(2));
                    order["totalSales"] = parseFloat(order.totalSales.toFixed(2)); 
                }
            }
            orders = orders.length?orders:[defaultOrder];
            resolve(orders);
        }
        catch (err)
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getTablesDetail = (restId) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            let tables = await models.restaurant.findOne({_id: restId}, {tableDetails: 1, _id: 0});
            resolve(tables.tableDetails);
        }
        catch(err) 
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

module.exports = {
    addOrder,
    addTableOrder,
    getOrders,
    getTableOrder,
    getTableOrders,
    getTablesDetail,
    getOrder,
    getOrderPerUser,
    updateOrderStatus,
    getOrdersAnalysis,
    getTableOrdersAnalysis,
    updateTableOrderStatus,
    updateTableBillStatus,
    getReportData,
    getReportSummary,

    getPosOrders
}