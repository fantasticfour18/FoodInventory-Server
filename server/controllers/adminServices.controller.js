const logger = require('../../config/logger');
const adminService = require('../service/adminServies');
const menuService = require('../service/menuServices');
const restaurantService = require('../service/restaurantServices')
const ownerService = require('../service/ownerServices')
const jwt = require('jsonwebtoken');

const addAdmin = (req, res) => {
		logger.info('Inside Add Admin Controller');
		
		let admin = req.body;
		
		adminService.addAdmin(admin).then(data => {
			res.json({success: true, msg: data});
		})
		.catch((err) => {
			logger.fatal(err);
			res.json({success: false, msg: err});
		})
}

const adminLogin = (req, res) => {
    logger.info('Inside Admin Login Controller')

    let admin = req.body;

    adminService.adminLogin(admin).then(adminData => {
		
        logger.info(adminData);
        
        let payLoad = {
            id: adminData._id,
            email: adminData.email,
        }

        let token = jwt.sign(payLoad, 'my_secret_key', { expiresIn: "1y" });

        res.status(200).json({success: true, data: token});
    })
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	})
}

const addRestaurant = (req,res,next)=>{
    logger.trace("inside add restaurant profile controller");
    let restaurantProfile = req.body.restaurant;
   
    adminService.addRestaurant(restaurantProfile).then(restId=>{
		logger.info('After adding restuarnt....', restId);
		addOwner(req, res, restId);
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addOwner = (req,res,restId)=>{
  logger.trace("inside add owner profile controller");
  let ownerData = req.body.owner;
  
  adminService.addOwner(ownerData, restId).then(ownerId => {
		logger.info('After adding owner....', ownerId);
		updateRestaurantOwner(req, res, restId, ownerId);
    
  }).catch(err=>{
    logger.fatal(err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  });
}

const updateRestaurantOwner = (req, res, restaurant, owner) => {
	logger.trace("inside restaurant owner update controller restaurnat...", restaurant);
	logger.trace("inside restaurant owner update controller owner...", owner);
	
	adminService.updateRestaurantOwner(restaurant, owner).then(data => {
		res.status(200).json({"success":true, "message": data});
	}).catch(err => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	})
}

const getAllRestaurants = (req, res) => {
	
	adminService.getAllRestaurants().then(async (data) => {
		
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

		logger.info(orderSummary);
		res.status(200).json({success: true, restaurants: restaurants});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	})
	
}

const getOrderGraphs = (req, res) => {
	
	logger.info("Inside get order graphs controller", );
	
	adminService.getOrderGraphs(req.params.id).then(data => {
		
		res.status(200).json({success: true, graphData: data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
	
}

const getDaysGraphs = (req, res) => {
	
	logger.info("Inside get days graphs controller", );
	
	adminService.getDaysGraphs(req.params.id).then(data => {
		
		res.status(200).json({success: true, graphData: data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
	
}

const resetPassword =( req, res) => {
	logger.info('Inside reset password');

	let email = req.body.email;
	let pass = req.body.password;

	adminService.resetPassword(email, pass).then(data => {

		res.status (200).json({success: true, message: data});

	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestOwner = (req, res) => {
	logger.info("Inside get owners controller");
	adminService.getRestOwner(req.params.id).then(data => {

		res.status(200).json({success: true, owner: data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})

}

const getRestItems = (req, res) => {

	menuService.getItems(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestCategories = (req, res) => {
	menuService.getCategories(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestToppingGroup = (req, res) => {
	menuService.getToppingGroups(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestOption = (req, res) => {
	menuService.getOptions(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestTopping = (req, res) => {
	menuService.getToppings(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestItem = (req, res) => {

	let itemData = req.body;
	let restId = req.params.id;
	itemData.restaurantId = restId;

	logger.info('inside add item-->', itemData);
	if(!itemData.imgRes)
    {
		// Parse String Data Back to JSON object
        if(itemData.allergyGroup == 'null') {
			itemData.allergyGroup = JSON.parse(itemData.allergyGroup);
		}

		if(itemData.description == 'null') {
			itemData.description = JSON.parse(itemData.description);
		}
			
		itemData.options = JSON.parse(itemData.options);
		itemData.variants = JSON.parse(itemData.variants);
		itemData.price = JSON.parse(itemData.price);

		menuService.addItem(itemData, restId).then(async data => {

			await menuService.updateSequenceCounter('items', restId, null);
			io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
			res.status(200).json({"success":true, "data":data});
		})
		.catch((err) => {
			logger.fatal(err);
			return res.status(err.code?err.code:404).json({success: false, message: err.message});
		})
	}
	//Update Image File Name after adding Item
    else if(itemData.imgRes && itemData.imgRes == 'onImageAdded') 
    {
        menuService.updateMenuImage('ITEM', itemData.itemId).then(async (data) => {
            await menuService.updateSequenceCounter('items', restId, null);

            io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
            res.status(200).json({"success":true, "data":"item added successfully..."});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    //CLear garbage image and chunks on adding duplicate category 
    else if(itemData.imgRes && itemData.imgRes == 'onError') {
        gridFs.db.collection('fs.files').deleteMany({});
        gridFs.db.collection('fs.chunks').deleteMany({});
        
        res.status(404).json({success: false, message: `${itemData.name} already exists in this category`});
    }
	
}

const updateRestItem = (req, res) => {
	let id = req.params.id;
	let itemData = req.body;
	let restId = itemData.restId;

	if(itemData.imgRes && itemData.imgRes == 'onImageAdded') {
        itemData.imageName = 'ITEM' + id;
    }

    // Parse String Data Back to JSON object
	if(itemData.allergyGroup == 'null') {
		itemData.allergyGroup = JSON.parse(itemData.allergyGroup);
	}
  
	if(itemData.description == 'null') {
		itemData.description = JSON.parse(itemData.description);
	}
		
	itemData.options = JSON.parse(itemData.options);
	itemData.variants = JSON.parse(itemData.variants);
	itemData.price = JSON.parse(itemData.price);

	menuService.updateItem(id, itemData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestTopping = (req, res) => {

	let toppingData = req.body;
	let restId = req.params.id;
	toppingData.restaurantId = restId;

	menuService.addTopping([toppingData], restId).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestToppingGroup = (req, res) => {

	let toppingGroupData = req.body;
	let restId = req.params.id;
	toppingGroupData.restaurantId = restId;

	menuService.addToppingGroup(toppingGroupData, restId).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestOption = (req, res) => {

	let optionData = req.body;
	let restId = req.params.id;
	optionData.restaurantId = restId;

	menuService.addOption([optionData], restId).then( async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestCategory = (req, res) => {

	let categoryData = req.body;
	let restId = req.params.id;
	categoryData.restaurantId = restId;

	if(!categoryData.imgRes)
	{	
		if(categoryData.description == 'null') {
			categoryData.description = JSON.parse(categoryData.description);
		}

		menuService.addCategory(categoryData, restId).then(async data => {

			await menuService.updateSequenceCounter('categories', restId, data.seq);
			io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
			res.status(200).json({"success":true, "data":data});
		})
		.catch((err) => {
			logger.fatal(err);
			return res.status(err.code?err.code:404).json({success: false, message: err.message});
		})
	}
	//Update Image File Name after adding Category
    else if(categoryData.imgRes && categoryData.imgRes == 'onImageAdded') 
    {
        menuService.updateMenuImage('CAT', categoryData.catId).then(async (data) => {
            await menuService.updateSequenceCounter('categories', restId, categoryData.sequence);

            io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
            res.status(200).json({"success":true, "data":"category added successfully..."});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    //CLear garbage image and chunks on adding duplicate category 
    else if(categoryData.imgRes && categoryData.imgRes == 'onError') {
        gridFs.db.collection('fs.files').deleteMany({});
        gridFs.db.collection('fs.chunks').deleteMany({});
        
        res.status(404).json({success: false, message: 'duplicate entry found'});
    }
	
}

const deleteRestItem = (req, res) => {

	let restId = req.query.restId;

	logger.info("Inside Rest Delete Category Controller" , req.params.id);
	menuService.deleteItem(req.params.id).then(async data => {
		let fileId = await gridFs.files.findOneAndDelete({filename: 'ITEM' + req.params.id});
        if(fileId.value) {
          gridFs.db.collection('uploads.chunks').deleteMany({files_id: fileId.value._id});
        }

		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestCategory = (req, res) => {

	let restId = req.query.restId;

	logger.info("Inside Rest Delete Category Controller" , req.params.id);
	menuService.deleteCategory(req.params.id).then(async data => {

		let fileId = await gridFs.files.findOneAndDelete({filename: 'CAT' + req.params.id});
        if(fileId.value) {
          gridFs.db.collection('uploads.chunks').deleteMany({files_id: fileId.value._id});
        }

		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestOption = (req, res) => {

	let restId = req.query.restId;

	logger.info("Inside Rest Delete Option Controller" , req.params.id);
	menuService.deleteOption(req.params.id).then(async data => {

		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestTopping = (req, res) => {

	let restId = req.query.restId;

	logger.info("Inside Rest Delete Topping Controller" , req.params.id);
	menuService.deleteTopping(req.params.id).then(async data => {

		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestToppingGroup = (req, res) => {

	let restId = req.query.restId;

	logger.info("Inside Rest Delete Topping Group Controller" , req.params.id);
	menuService.deleteToppingGroup(req.params.id).then(async data => {

		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestCategory = (req, res) => {
	let id = req.params.id;
	let categoryData = req.body;
	let restId = categoryData.restId;

	if(categoryData.imgRes && categoryData.imgRes == 'onImageAdded') {
        categoryData.imageName = 'CAT' + id;
    }
	
	if(categoryData.description == 'null') {
		categoryData.description = JSON.parse(categoryData.description);
	}

	menuService.updateCategory(id, categoryData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestOption = (req, res) => {
	let id = req.params.id;
	let optionData = req.body;
	let restId = optionData.restId;

	menuService.updateOption(id, optionData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestTopping = (req, res) => {
	let id = req.params.id;
	let toppingData = req.body;
	let restId = toppingData.restId;

	menuService.updateTopping(id, toppingData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestToppingGroup = (req, res) => {
	let id = req.params.id;
	let toppingGroupData = req.body;
	let restId = toppingGroupData.restId;

	menuService.updateToppingGroup(id, toppingGroupData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestAllergy = (req, res) => {

	let allergyData = req.body;
	let restId = req.params.id;
	allergyData.restaurantId = restId;

	menuService.addAllergy(allergyData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestAllergy = (req, res) => {
	menuService.getAllergies(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestAllergy = (req, res) => {

	let restId = req.query.restId;

	logger.info("Inside Rest Delete Allergy Controller" , req.params.id);
	menuService.deleteAllergy(req.params.id).then(async data => {

		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestAllergy = (req, res) => {
	let id = req.params.id;
	let allergyData = req.body;
	let restId = allergyData.restId;

	menuService.updateAllergy(id, allergyData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const getRestAllergyGroup = (req, res) => {
	menuService.getAllergyGroups(req.params.id).then(data => {
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestAllergyGroup = (req, res) => {

	let allergyGroupData = req.body;
	let restId = req.params.id;
	allergyGroupData.restaurantId = restId;

	menuService.addAllergyGroup(allergyGroupData, restId).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestAllergyGroup = (req, res) => {

	let restId = req.query.restId;

	logger.info("Inside Rest Delete Allergy Group Controller" , req.params.id);
	menuService.deleteAllergyGroup(req.params.id).then(async data => {

		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestAllergyGroup = (req, res) => {
	let id = req.params.id;
	let allergyGroupData = req.body;
	let restId = allergyGroupData.restId;

	menuService.updateAllergyGroup(id, allergyGroupData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const restSetting = (req, res) => {
	let restId = req.params.id;
	let settingDetails = req.body;

	restaurantService.restaurantSetting(restId, settingDetails).then(async (data) => {
		io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const ownerEditProfile = (req, res) => {
	let restId = req.params.id;
	let restaurantDetails = req.body;

	ownerService.ownerEditProfile(restId, restaurantDetails).then(async (data) => {
		io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestaurantDiscount = (req, res) => {
	let restId = req.params.id;
	let restaurantDiscount = req.body;

	restaurantService.updateRestaurantDiscount(restId, restaurantDiscount).then(async (data) => {
		io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestaurantStatus = (req, res) => {
	let restId = req.params.id;
	let status = req.body.isOnline;

	restaurantService.updateRestaurantStatus(restId, status).then(async (data) => {
		io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const addRestDistanceDetails = (req,res,next)=>{
    
    let distanceData = req.body;
    let restId = req.params.id;

	// Parse values to string
	if(distanceData)
	{
		distanceData["minOrder"] = distanceData["minOrder"] + "";
		distanceData["deliveryCharge"] = distanceData["deliveryCharge"] + "";
		distanceData["deliveryTime"] = distanceData["deliveryTime"] + "";  
	}

    logger.trace("inside update restaurant distance controller");
    restaurantService.addRestDistance(distanceData, restId).then(async (data)=>{
        io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateRestDistanceDetails = (req, res, next) => {
    let distanceData = req.body;
    let restId = req.params.id;

	// Parse values to string
	if(distanceData)
	{
		distanceData["minOrder"] = distanceData["minOrder"] + "";
		distanceData["deliveryCharge"] = distanceData["deliveryCharge"] + "";
		distanceData["deliveryTime"] = distanceData["deliveryTime"] + "";  
	}

    logger.trace("inside update restaurant distance controller....", distanceData);
    restaurantService.getRestDistance(restId).then(async (distResp)=>{

        let distDetails = distResp.distDetails, acceptedPostcodes = distResp.acceptedPostcodes, oldPostcode;

        // Update Distance Details Array
        for(let i = 0; i < distDetails.length; i++) {
            if(distanceData.id == distDetails[i].id) 
            {
                oldPostcode = distDetails[i].postcode; 
                distDetails[i] = distanceData;
                break;
            }
        }

        // Update acceptedPostcode Array
        for(let i = 0; i < acceptedPostcodes.length; i++) {
            if(oldPostcode == acceptedPostcodes[i]) {
                acceptedPostcodes[i] = distanceData.postcode;
                break;
            }
        }

        logger.info('Accepted postcodes--->', acceptedPostcodes);

        // Check if updated postcode already exists 
        if(new Set(acceptedPostcodes).size === acceptedPostcodes.length)
        {
            restaurantService.updateRestDistance(distDetails, acceptedPostcodes, restId).then(async (data) => {
                io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));
                res.status(200).json({"success":true, "data":data});
            })
            .catch(err => {
                logger.fatal(err);
                return res.status(err.code?err.code:404).json({"success":false,"message":err.message});    
            })
        }
        else {
            return res.status(200).json({"success":false,"message":"Postcode already exists"});
        }
        
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteRestDistanceDetails = (req, res, next) => {
    let distanceData = req.body;
    let restId = req.params.id;
    logger.trace("inside delete restaurant distance controller....", distanceData);

    restaurantService.getRestDistance(restId).then(async (distResp)=>{

        let distDetails = distResp.distDetails, acceptedPostcodes = distResp.acceptedPostcodes, oldPostcode;

        // Delete Distance Details Array
        for(let i = 0; i < distDetails.length; i++) {
            if(distanceData.id == distDetails[i].id) {
                oldPostcode = distDetails[i].postcode;
                distDetails.splice(i,1);
                break;
            }
        }

        // Delete acceptedPostcode Array
        for(let i = 0; i < acceptedPostcodes.length; i++) {
            if(oldPostcode == acceptedPostcodes[i]) {
                acceptedPostcodes.splice(i,1);
                break;
            }
        }

        restaurantService.updateRestDistance(distDetails, acceptedPostcodes, restId).then(async (data) => {
            io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));
            res.status(200).json({"success":true, "data":"Postcode Deleted successfully"});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});    
        })
        
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getTimeSlots = (req, res, next) => {
	let restId = req.params.id;
    logger.trace("inside get restaurant time slots controller....");

	restaurantService.getTimeSlots(restId).then(data => {
		return res.status(200).json({success:true, data: data});
	})
	.catch(err => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success:false, message:err.message});
	})
}

// Varinats APIs
const getRestVariants = (req, res) => {
	let restId = req.params.id;
	logger.info('inside get variants admin controller');

	menuService.getVariants(restId).then(data => {
		return res.status(200).json({success: true, data: data});
	})
	.catch(err => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success:false, message:err.message});
	})
}

const addRestVariant = (req, res) => {
	let variantData = req.body;
	let restId = req.params.id;
	variantData.restaurantId = restId;

	menuService.addVariant([variantData], restId).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestVariant = (req, res) => {
	let id = req.params.id;
	let variantData = req.body;
	let restId = variantData.restId

	menuService.updateVariant(id, variantData, restId).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestVariant = (req, res) => {
	let id = req.params.id;
	let restId = req.query.restId;
	logger.info('inside delete variant admin controller');

	menuService.deleteVariant(id).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		return res.status(200).json({success: true, data: data});
	})
	.catch(err => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success:false, message:err.message});
	})
}

const getRestVariantGroups = (req, res) => {
	let restId = req.params.id;
	logger.info('inside get variant groups admin controller');

	menuService.getVariantGroups(restId).then(data => {
		return res.status(200).json({success: true, data: data});
	})
	.catch(err => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success:false, message:err.message});
	})
}

const addRestVariantGroup = (req, res) => {
	let variantGroupData = req.body;
	let restId = req.params.id;
	variantGroupData.restaurantId = restId;

	menuService.addVariantGroup(variantGroupData, restId).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const updateRestVariantGroup = (req, res) => {
	let id = req.params.id;
	let variantData = req.body;
	let restId = variantData.restId;

	menuService.updateVariantGroup(id, variantData).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		res.status(200).json({"success":true, "data":data});
	})
	.catch((err) => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success: false, message: err.message});
	})
}

const deleteRestVariantGroup = (req, res) => {
	let id = req.params.id;
	let restId = req.query.restId;
	logger.info('inside delete variant group admin controller');

	menuService.deleteVariantGroup(id).then(async (data) => {
		io.sockets.in(restId).emit('refreshHome', await menuService.getItemsForHomePage(restId));
		return res.status(200).json({success: true, data: data});
	})
	.catch(err => {
		logger.fatal(err);
		return res.status(err.code?err.code:404).json({success:false, message:err.message});
	})
}

module.exports = {
	addAdmin,
    adminLogin,
    addRestaurant,
	addOwner,
	updateRestaurantOwner,
	getAllRestaurants,
	getOrderGraphs,
	getDaysGraphs,
	resetPassword,
	getRestOwner,

	getRestItems,
	getRestCategories,
	getRestToppingGroup,
	getRestOption,
	getRestTopping,

	addRestItem,
	updateRestItem,
	addRestTopping,
	addRestToppingGroup,
	addRestOption,
	addRestCategory,

	deleteRestItem,
	deleteRestCategory,
	deleteRestOption,
	deleteRestTopping,
	deleteRestToppingGroup,

	updateRestCategory,
	updateRestOption,
	updateRestTopping,
	updateRestToppingGroup,

	addRestAllergy,
	getRestAllergy,
	deleteRestAllergy,
	updateRestAllergy,

	getRestAllergyGroup,
	addRestAllergyGroup,
	deleteRestAllergyGroup,
	updateRestAllergyGroup,

	restSetting,
	ownerEditProfile,
	updateRestaurantDiscount,
	updateRestaurantStatus,
	addRestDistanceDetails,
	updateRestDistanceDetails,
	deleteRestDistanceDetails,

	getRestVariants,
	addRestVariant,
	updateRestVariant,
	deleteRestVariant,
	getRestVariantGroups,
	addRestVariantGroup,
	updateRestVariantGroup,
	deleteRestVariantGroup,

	getTimeSlots
}