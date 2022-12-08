const logger = require('../../config/logger');
const orderService = require('../service/orderServices');
const models = require('../../models');
const mongoose = require('mongoose');
const { sendConfirmationEmail } = require('../helpers/mailer');
const adminService = require('../service/adminServies');
const moment = require('moment');

const addOrder = (req,res,next)=>{
    let orderDetails = req.body;
    let userDetails; 

    // For normal Pickup or Delivery with Token 
    userDetails = req.payLoad;
    logger.trace("inside add order controller",orderDetails);
	
    orderService.addOrder(orderDetails,userDetails).then(data=>{
        		
        return res.status(200).json({"success":true, "data": data.msg, 
                                    "ownerId": data.owner, "orderId": data.orderId, "orderNumber": data.orderNumber});	
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

// For Table QR Order
const addTableOrder = (req,res,next)=>{
    let orderDetails = req.body;  

    logger.trace("inside add table order controller",orderDetails);
	
    orderService.addTableOrder(orderDetails).then(async data=> {
        		
        let condition = {};
        condition.createdOn = {
            $gte: new Date(new Date(Date.now()).setUTCHours(0, 0, 0, 0)), 
            $lt: new Date(new Date(Date.now()).setUTCHours(23, 59, 59, 999))
        }
        condition.orderStatus = {$in:['PENDING', 'PAYING', 'ACCEPTED']};
        condition.restaurantId = orderDetails.restaurantId;

        io.sockets.in(data.owner.email).emit("onTableOrderAdded", {"success":true, "data": await orderService.getTableOrders(condition)});
        io.sockets.in(data.owner.email).emit("onTableStatusChanged", {success: true, data: await orderService.getTablesDetail(orderDetails.restaurantId)});
        // Send Order Id Per User
		if(data.orderId) {
			io.sockets.in(data.owner.email).emit("onTableAutoPrintOrder", data.orderId);
		}

        return res.status(200).json({"success":true, "data": data.msg, "isOrderAdded": data.isOrderAdded,
                                    "ownerId": data.owner, "orderId": data.orderId, "orderNumber": data.orderNumber});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getOrders = (req,res,next)=>{
    logger.trace("inside get orders controller");
    let condition = {};

    // Restaurant ID for Admin or Frontend User
    if(req.query.restId) {
        condition.restaurantId = req.query.restId;
    }
	
    condition.createdOn = {
        $gte: new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(0, 0, 0, 0)), 
        $lt: new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(23, 59, 59, 999))
    }
    condition.orderStatus = {$in:['PENDING','ACCEPTED', 'DENIED']};

    // Flutter Owner Token RestaurantId
    if(req.payLoad.userType == 'owner') {
        condition.restaurantId = req.payLoad.restaurantId;
    }
    // Customer end token
    else if(req.payLoad.userType == 'customer') 
    {
        condition["userDetails.email"] = req.payLoad.email;
        delete condition.createdOn;
    }
    
    if(req.query.orderStatus) {
        condition.orderStatus=req.query.orderStatus.toUpperCase();
        /*if(condition.orderStatus == "DENIED" && !req.query.date){
            delete condition.createdOn;
        }*/
    }

    orderService.getOrders(condition).then(async data=>{
        delete condition.orderStatus;
        let summaryData = await orderService.getOrdersAnalysis(condition);
        res.status(200).json({"success":true, "data":data,"summaryData":summaryData[0]});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

// For Table QR Order
const getTableOrders = (req,res,next)=>{
    logger.trace("inside get table orders controller");
    let condition = {};

    if(req.query.restId) 
    {
        condition.restaurantId = req.query.restId;
        condition.orderStatus = {$in:['PENDING']};
        condition.tableNumber = parseInt(req.query.tableNumber);
    }
    else 
    {
        condition.restaurantId = req.payLoad.restaurantId;
        condition.orderStatus = {$in:['PENDING', 'PAYING', 'ACCEPTED']};
    }
	
    condition.createdOn = {
        $gte: new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(0, 0, 0, 0)), 
        $lt: new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(23, 59, 59, 999))
    }

    if(req.query.orderStatus){
        condition.orderStatus=req.query.orderStatus.toUpperCase();
        /*if(condition.orderStatus == "DENIED" && !req.query.date){
            delete condition.createdOn;
        }*/
    }

    orderService.getTableOrders(condition).then(async data=>{
        delete condition.orderStatus;
        let summaryData = await orderService.getTableOrdersAnalysis(condition);
        res.status(200).json({"success":true, "data":data, "summaryData": summaryData[0]});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}


const getOrder = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get order by id controller",{id});
    orderService.getOrder(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

// For Table Order (single order)
const getTableOrder = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get table order by id controller",{id});
    orderService.getTableOrder(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getOrderHistory = (req,res,next)=>{
    logger.trace("inside get order history controller");
    let condition = {};
    /* let startDate = new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(23, 59, 59, 999));
    let endDate = new Date(new Date(req.query.date?req.query.date:Date.now()).setUTCHours(0, 0, 0, 000));
    endDate = endDate.setDate(endDate.getDate() - 30);
    condition.createdOn = {
        $lt: startDate,
        $gte: new Date(endDate),
    } */

    if(req.payLoad.userType == 'owner') {
        condition.restaurantId = req.payLoad.restaurantId;
    }

    orderService.getOrdersAnalysis(condition).then(data=>{
        res.status(200).json({"success":true, "data":data});
    })
    .catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateOrderStatus = (req,res,next)=>{
    let id = req.params.id;
    let orderStatus = req.body.orderStatus;
    
    if(req.payLoad.userType)
    {
        orderService.updateOrderStatus(id,orderStatus,req.payLoad.restaurantId).then(async (data)=>{

            io.sockets.in(id).emit('refreshOrder', await orderService.getOrder(id));
            sendConfirmationEmail(data.order, data.restData);

            // Get Restaurant Summary Data for Admin
            await adminService.getAllRestaurants().then(async (data) => {
		
                let restaurants = JSON.parse(JSON.stringify(data));
        
                let condition = {};
                condition.createdOn = {
                    $gte: new Date(new Date(Date.now()).setUTCHours(0, 0, 0, 0)), 
                    $lt: new Date(new Date(Date.now()).setUTCHours(23, 59, 59, 999))
                }
                
                // Map Order Summary for each Restaurants
                let orderSummary = await adminService.getOrderAnalysis(condition);
        
                if(orderSummary.length)
                {
                    restaurants.forEach((restaurant, index) => {
        
                        let restFound = false;
                        orderSummary.forEach(order => {
                            if(restaurant._id == order._id) {
                                restaurants[index]['orderSummary'] = order;
                                restFound = true;
                            }
                        });
        
                        // If Today Order is not available for Selected Restaurant
                        if(!restFound)
                        {
                            restaurants[index]['orderSummary'] = {
                                _id: 0,
                                acceptedOrder: 0,
                                declinedOrder: 0,
                                pendingOrder: 0,
                                orderRecieved: 0,
                                onlineOrderAmount: 0,
                                cashOrderAmount: 0,
                                totalOrderAmount: 0
                            };
                        }
                    })
                }
                // No Order Summary is Available for all restaurants
                else
                {
                    restaurants.forEach((restaurant, index) => {
                        restaurants[index]['orderSummary'] = {
                            _id: 0,
                            acceptedOrder: 0,
                            declinedOrder: 0,
                            pendingOrder: 0,
                            orderRecieved: 0,
                            onlineOrderAmount: 0,
                            cashOrderAmount: 0,
                            totalOrderAmount: 0
                        };
        
                    });
                }
                
                io.sockets.in("ADMIN@" + await adminService.getAdmin()).emit('onOrderSummaryChange', restaurants);
            });

            res.status(200).json({"success":true, "data":data.order});
        }).catch(err=>{
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    else {
        return res.status(401).json({"success":false,"message":"only updated by admin user"});
    }
    
}

const updateTableOrderStatus = (req, res) => {
    let id = req.params.id;
    let orderStatus = req.body.orderStatus;
    
    if(req.payLoad.userType)
    {
        orderService.updateTableOrderStatus(id,orderStatus,req.payLoad.restaurantId).then(async (data)=>{
            io.sockets.in('table' + data.order.tableNumber).emit('refreshTableOrder', await orderService.getTableOrder(id));

            let condition = {};
            condition.createdOn = {
                $gte: new Date(new Date(Date.now()).setUTCHours(0, 0, 0, 0)), 
                $lt: new Date(new Date(Date.now()).setUTCHours(23, 59, 59, 999))
            }
            condition.orderStatus = {$in:['PENDING', 'PAYING', 'ACCEPTED']};
            condition.restaurantId = req.payLoad.restaurantId;
            
            // For Table Status Changed
            io.sockets.in(req.payLoad.email).emit("onTableStatusChanged", {success: true, data: await orderService.getTablesDetail(req.payLoad.restaurantId)});
            io.sockets.in(req.payLoad.email).emit("onTableOrderAdded", {"success":true, "data": await orderService.getTableOrders(condition)});
            //sendConfirmationEmail(data.order, data.restEmail);
            res.status(200).json({"success":true, "data":data.order});
        })
        .catch(err=>{
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    else {
        return res.status(401).json({"success":false,"message":"only updated by admin user"});
    }
}

const updateTableBillStatus = (req, res) => {
    logger.info("inside update table bill status controller...");

    orderService.updateTableBillStatus(req.body.restId, req.body.tableNumber).then(async data => {
        let condition = {};
        condition.createdOn = {
            $gte: new Date(new Date(Date.now()).setUTCHours(0, 0, 0, 0)), 
            $lt: new Date(new Date(Date.now()).setUTCHours(23, 59, 59, 999))
        }
        condition.orderStatus = {$in:['PENDING', 'PAYING', 'ACCEPTED']};
        condition.restaurantId = req.body.restId;

        io.sockets.in(data.owner.email).emit('onTableOrderAdded', {"success": true, "data": await orderService.getTableOrders(condition)});
        res.status(200).json({success: true, isBillPaid: true, message: "bill paid successfully", order: data.order});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

// For POS Orders
const getPosOrders = (req, res) => {
    logger.info("inside get POS order controller...");

    orderService.getPosOrders(req.params.id).then(async data => {
        const orders = data;
        let posOrders = [], totalOrders = []; 

        if(orders && orders.length)
        {
            /******* Kasse Order JSON     *******/
            orders.forEach((order, i) => {
                posOrders.push({
                    // Main params
                    id: order._id,
                    orderPlaceDate: order.orderDateTime,
                    deliveryTime: order.orderTime,
                    deliveryType: order.deliveryType == "DELIVERY" ? "0" : "1",
                    deliveryCost: order.deliveryCharge,
                    totalAmount: order.totalAmount,
                    paymentMethod: order.paymentMode == "Barzahlung" ? "0" : "1",
                    sender: "Food Inventory",
                    
                    // Customer Details
                    Customer: {
                        comment: "",
                        customerId: "",
                        name: order.userDetails.firstName + " " + order.userDetails.lastName,
                        firmName: "",
                        phoneNo: order.userDetails.contact,
                        street: (order.userDetails.houseNumber && order.userDetails.street) ?  
                                (order.userDetails.houseNumber + ", " + order.userDetails.street) : "",
                    },
                    
                    deliveryAddress: {
                        City: order.deliveryType == 'DELIVERY' ? order.userDetails.postcode : "",
                        Street: order.deliveryType == 'DELIVERY' ? (order.userDetails.houseNumber + ", " + order.userDetails.street) : "",
                        zip: order.deliveryType == 'DELIVERY' ? order.userDetails.postcode : "",
                    },
                });

                // Item Details
                posOrders[i]["products"] = [];
                order.itemDetails.forEach((item, j) => {
                    posOrders[i]["products"].push({
                        itemId: item._id,
                        name: item.name,
                        count: item.quantity,
                        price: item.price,
                        unitPrice: item.price,
                        cookingIns: item.note,
                        isCookingInstruction: item.note ? ((item.note.length) ? "true" : "false") : "false",
                        Sub: [],
                        beverage: "",                        
                    });

                    // Add Option inside Subs
                    if(item.option.length)
                    {
                        posOrders[i]["products"][j]["Sub"].push({
                            itemId: item._id,
                            name: item.option,
                            count: item.quantity,
                            price: item.price,
                            unitPrice: item.price
                        });
                    }

                    // Add Toppings for item added
                    item.toppings.forEach(topping => {
                            posOrders[i]["products"][j]["Sub"].push({
                            id: topping._id,
                            itemId: item._id,
                            name: topping.name,
                            count: topping.toppingCount,
                            price: topping.price,
                            unitPrice: topping.price
                        });
                    })
                })

                totalOrders.push({Order: posOrders[i]});
            })

            /******* Original Order JSON *******/
            /* orders.forEach((order, i) => {
                posOrders.push({
                    // Main params
                    id: order._id,
                    orderKey: null,
                    publicReference: null,
                    platform: "namasteindiafrankfurt.de",
                    restaurantId: order.restaurantId,
                    orderDate: order.orderDateTime,
                    requestedDeliveryTime: order.orderTime,
                    orderType: order.deliveryType,
                    courier: "restaurant",
                    deliveryCosts: order.deliveryCharge,
                    totalPrice: order.totalAmount,
                    totalDiscount: order.discount,
                    isPaid: order.isPaid,
                    paymentMethod: order.paymentMode,
                    orderStatus: order.orderStatus,
                    
                    // Customer Details
                    customer: {
                        name: order.userDetails.firstName + " " + order.userDetails.lastName,
                        companyName: "",
                        phoneNumber: order.userDetails.contact,
                        street: order.userDetails.street,
                        streetNumber: order.userDetails.houseNumber,
                        postalCode: order.userDetails.postcode,
                        city: order.userDetails.city,
                        extraAddressInfo: ""
                    },

                    // Additional or Extras
                    remark: order.note,
                    version: "v1",
                    clientKey: null,
                });

                // Item Details
                posOrders[i]["products"] = [];
                order.itemDetails.forEach((item, j) => {
                    posOrders[i]["products"].push({
                        id: item._id,
                        name: item.name,
                        category: "",
                        count: item.quantity,
                        price: item.price,
                        remark: item.note,
                        sideDishes: [],
    
                        // Additional params
                        option: item.option,
                        variant: item.variant,
                        variantPrice: item.variantPrice,
                        subVariant: item.subVariant,
                        subVariantPrice: item.subVariantPrice,
                        discount: item.discount,
                        catDiscount: item.catDiscount,
                        orderDiscount: item.overallDiscount
                    });

                    // Add Toppings for item added
                    item.toppings.forEach(topping => {
                            posOrders[i]["products"][j]["sideDishes"].push({
                            id: topping._id,
                            name: topping.name,
                            count: topping.toppingCount,
                            price: topping.price
                        });
                    })
                })
            }) */

            res.status(200).json(totalOrders);
        }
        else {
            res.status(200).json([]);
        }
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code? err.code : 404).json({success: false, message: err.message});
    });
}

const getReportData = (req, res) => {
    logger.info("inside get get report data controller...");
    
    const reportType = req.query.type;
    let condition = {};

    condition.restaurantId = req.payLoad.restaurantId;
    if(reportType == 'X') {
        condition.createdOn = {
            $gte: new Date(new Date(Date.now()).setUTCHours(0, 0, 0, 0)), 
            $lt: new Date(new Date(Date.now()).setUTCHours(23, 59, 59, 999))
        }
    }
    else if(reportType == 'Y') {
        let today = new Date();
        condition.createdOn = {
            $gte: new Date(new Date(today.setUTCDate(1)).setUTCHours(0, 0, 0, 0)), 
            $lt: new Date(new Date(today.setUTCDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate())).setUTCHours(23, 59, 59, 999))
        }
    }
    
    condition.orderStatus = {$in:['ACCEPTED']};

    orderService.getReportData(reportType, condition).then(async data => {
        const reportSumm = await orderService.getReportSummary(condition);
        let reportSummary = reportSumm, restDetails = data.restaurantDetails;
        
        if(reportType == 'X') {
            reportSummary[0]["_id"] = moment().format('DD/MM/YYYY hh:mm:ss A');
        }
        else if(reportType == 'Y') 
        {
            for await (let report of reportSummary) {
                report["date_id"] = moment(report._id, "YYYY-MM-DD");
                report["_id"] = moment(report._id).format('DD.MM.YYYY') + moment().format(' hh:mm:ss A');
            }

            reportSummary = reportSummary.sort((a,b) => a.date_id - b.date_id);
        }
        
        return res.status(200).json({success: true, restDetails: restDetails, reportData: data.orders, reportSummary: reportSummary});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code? err.code : 404).json({success: false, message: err.message});
    })
}

const getTablesDetail = (req, res) => {
    let restId = req.payLoad.restaurantId;

    orderService.getTablesDetail(restId).then(data => {
        return res.status(200).json({success: true, data: data})
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code? err.code : 404).json({success: false, message: err.message});
    })
}

const stripePaymentIntent = (req, res) => {
    const stripe = require('stripe')('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');
    //const stripe = require('stripe')('sk_test_51LQYVdKlsCyOE8713wpanusNwqI11tGe8htwFCJId7zmkNuYYm7SQGMRk3TSdDVOp0jcrf1S9jKSRXeRsCGNIeYY00Mtgby04r');

    logger.info(req.body);
    let amount = req.body.orderTotal.replace('.', '');

    const paymentIntent = stripe.paymentIntents.create({
        amount: amount,
        currency: "EUR",
        description: "Payment done",
        receipt_email: req.payLoad.email,
        automatic_payment_methods: {
          enabled: false,
        },
    })
    .then((paymentIntent) => {
        res.status(200).json({success: true, clientSecret: paymentIntent.client_secret});
    })
    .catch((err) => {
        logger.fatal(err);
        res.status(200).json({success: false, message: "Payment failed. Please try again"});
    })
}

const stripeCheckout = (req, res) => {
    const stripe = require('stripe')('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');
    //const stripe = require('stripe')('sk_test_51LQYVdKlsCyOE8713wpanusNwqI11tGe8htwFCJId7zmkNuYYm7SQGMRk3TSdDVOp0jcrf1S9jKSRXeRsCGNIeYY00Mtgby04r');
    
    logger.info(req.body);
    let stripeToken = req.body.stripeToken, amount = req.body.orderTotal.replace('.', '');

    const customer = stripe.customers.create({
        email: stripeToken.email,
        source: stripeToken.id
    })
    .then((customer) => {
        logger.info(customer);
        return stripe.charges.create({
            amount: amount,
            description: "Payment done",
            currency: "EUR",
            customer: customer.id
        });
    })
    .then((charge) => {
        logger.info(charge);
        res.status(200).json({success: true, message: "Payment successful"});
    })
    .catch((err) => {
        logger.fatal(err);
        res.status(200).json({success: false, message: "Payment failed. Please try again"});
    })
}

module.exports = {
    addOrder,
    addTableOrder,
    getTableOrder,
    getTableOrders,
    getTablesDetail,
    getOrders,
    getOrder,
    updateOrderStatus,
    updateTableOrderStatus,
    updateTableBillStatus,
    getOrderHistory,
    getReportData,

    getPosOrders,
    stripePaymentIntent,
    stripeCheckout
}