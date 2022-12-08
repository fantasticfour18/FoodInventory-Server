const logger = require('../../config/logger');
const menuService = require('../service/menuServices');
const fs = require("fs");

// For Variant and Groups
const getVariants = (req,res,next)=>{
    logger.trace("inside get Variants controller");
    menuService.getVariants(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getVariant = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get Variant by id controller",{id});
    menuService.getVariant(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addVariant = (req,res,next)=>{
    let variantDetails = req.body.variantDetails;
    variantDetails.forEach(variant => {
        variant.restaurantId = req.payLoad.restaurantId;
    }); 

    logger.trace("inside add Variant controller",variantDetails);
    menuService.addVariant(variantDetails).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateVariant = (req,res,next)=>{
    let updateVariantObj = req.body;
    let id = req.params.id;

    // If variant does not have Group
    if(!updateVariantObj.variantGroup) {
        updateVariantObj.variantGroup = null;
    }

    logger.trace("inside update Variant controller",id,updateVariantObj);
    menuService.updateVariant(id, updateVariantObj, req.payLoad.restaurantId).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteVariant = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete Variant controller",id);
    menuService.deleteVariant(id).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getVariantGroups = (req,res,next)=>{
    logger.trace("inside get Variant groups controller");
    menuService.getVariantGroups(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getVariantGroup = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get Variant by id controller",{id});
    menuService.getVariantGroup(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addVariantGroup = (req,res,next)=>{
    let variantDetails = req.body;
    variantDetails.restaurantId = req.payLoad.restaurantId;
    logger.trace("inside add Variant controller",variantDetails);
    menuService.addVariantGroup(variantDetails).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateVariantGroup = (req,res,next)=>{
    let updateVariantGroupObj = req.body;
    let id = req.params.id;
    logger.trace("inside update Variant group controller",id,updateVariantGroupObj);
    menuService.updateVariantGroup(id,updateVariantGroupObj).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteVariantGroup = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete Variant group controller",id);
    menuService.deleteVariantGroup(id).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

// For Topping and Groups
const getToppings = (req,res,next)=>{
    logger.trace("inside get toppings controller");
    menuService.getToppings(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getTopping = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get topping by id controller",{id});
    menuService.getTopping(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addTopping = (req,res,next)=>{
    let toppingDetails = req.body.toppingDetails;
    toppingDetails.forEach(topping => {
        topping.restaurantId = req.payLoad.restaurantId
    }); 

    logger.trace("inside add topping controller",toppingDetails);
    menuService.addTopping(toppingDetails).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateTopping = (req,res,next)=>{
    let updateToppingObj = req.body;
    let id = req.params.id;
    logger.trace("inside update topping controller",id,updateToppingObj);
    menuService.updateTopping(id,updateToppingObj).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteTopping = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete topping controller",id);
    menuService.deleteTopping(id).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getToppingGroups = (req,res,next)=>{
    logger.trace("inside get topping groups controller");
    menuService.getToppingGroups(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getToppingGroup = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get topping by id controller",{id});
    menuService.getToppingGroup(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addToppingGroup = (req,res,next)=>{
    let toppingDetails = req.body;
    toppingDetails.restaurantId = req.payLoad.restaurantId;
    logger.trace("inside add topping controller",toppingDetails);
    menuService.addToppingGroup(toppingDetails).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateToppingGroup = (req,res,next)=>{
    let updateToppingGroupObj = req.body;
    let id = req.params.id;
    logger.trace("inside update topping group controller",id,updateToppingGroupObj);
    menuService.updateToppingGroup(id,updateToppingGroupObj).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteToppingGroup = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete topping group controller",id);
    menuService.deleteToppingGroup(id).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

// Modules for Allergies
const getAllergies = (req,res,next)=>{
    logger.trace("inside get allergies controller");
    menuService.getAllergies(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getAllergy = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get allergy by id controller",{id});
    menuService.getAllergy(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addAllergy = (req,res,next)=>{
    let allergyDetails = req.body;
    allergyDetails.restaurantId = req.payLoad.restaurantId;

    logger.trace("inside add allergy controller",allergyDetails);
    menuService.addAllergy(allergyDetails).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateAllergy = (req,res,next)=>{
    let updateAllergyObj = req.body;
    let id = req.params.id;
    logger.trace("inside update allergy controller",id,updateAllergyObj);
    menuService.updateAllergy(id,updateAllergyObj).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteAllergy = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete allergy controller",id);
    menuService.deleteAllergy(id).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

// Module for Allergy Groups
const getAllergyGroups = (req,res,next)=>{
    logger.trace("inside get allergy groups controller");
    menuService.getAllergyGroups(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getAllergyGroup = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get allergy by id controller",{id});
    menuService.getAllergyGroup(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addAllergyGroup = (req,res,next)=>{
    let allergyDetails = req.body;
    allergyDetails.restaurantId = req.payLoad.restaurantId;
    logger.trace("inside add allergy controller",allergyDetails);
    menuService.addAllergyGroup(allergyDetails).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateAllergyGroup = (req,res,next)=>{
    let updateAllergyGroupObj = req.body;
    let id = req.params.id;
    logger.trace("inside update allergy group controller",id,updateAllergyGroupObj);
    menuService.updateAllergyGroup(id,updateAllergyGroupObj).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteAllergyGroup = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete allergy group controller",id);
    menuService.deleteAllergyGroup(id).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getOptions = (req,res,next)=>{
    logger.trace("inside get options controller");
    menuService.getOptions(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getOption = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get option by id controller",{id});
    menuService.getOption(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addOption = (req,res,next)=>{
    let optionDetails = req.body;
    /* optionDetails.forEach(option => {
        option.restaurantId = req.payLoad.restaurantId;
    }) */
    optionDetails.restaurantId = req.payLoad.restaurantId;

    logger.trace("inside add option controller",optionDetails);
    menuService.addOption(optionDetails).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateOption = (req,res,next)=>{
    let updateOptionObj = req.body;
    let id = req.params.id;

    // If variant does not have Group
    if(!updateOptionObj.toppingGroup) {
        updateOptionObj.toppingGroup = null;
    }

    logger.trace("inside update option controller",id,updateOptionObj);
    menuService.updateOption(id, updateOptionObj, req.payLoad.restaurantId).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteOption = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete option controller",id);
    menuService.deleteOption(id).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getCategories = (req,res,next)=>{
    logger.trace("inside get categories controller");
    menuService.getCategories(req.payLoad.restaurantId).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getCategory = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get category by id controller",{id});
    menuService.getCategory(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addCategory =  async (req,res,next) => {
    let categoryDetails = req.body; //req.body.categoryDetails;
    /* categoryDetails.forEach(category => {
        category.restaurantId = req.payLoad.restaurantId;
    }) */
    categoryDetails.restaurantId = req.payLoad.restaurantId;

    logger.trace("inside add category controller",categoryDetails);
    //Add Category without Image
    if(!categoryDetails.imgRes)
    {
        menuService.addCategory(categoryDetails, req.payLoad.restaurantId).then(async (data)=>{

        await menuService.updateSequenceCounter('categories', req.payLoad.restaurantId, data.seq);

        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data.msg});
        })
        .catch(err=>{
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    //Update Image File Name after adding Category
    else if(categoryDetails.imgRes && categoryDetails.imgRes == 'onImageAdded') 
    {
        menuService.updateMenuImage('CAT', categoryDetails.catId).then(async (data) => {
            await menuService.updateSequenceCounter('categories', req.payLoad.restaurantId, categoryDetails.sequence);

            io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
            res.status(200).json({"success":true, "data":"category added successfully..."});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    //CLear garbage image and chunks on adding duplicate category 
    else if(categoryDetails.imgRes && categoryDetails.imgRes == 'onError') {
        gridFs.db.collection('fs.files').deleteMany({});
        gridFs.db.collection('fs.chunks').deleteMany({});
        
        res.status(404).json({success: false, message: 'duplicate entry found'});
    }
    
}

const updateCategory = (req,res,next)=>{
    let updateCategoryObj = req.body;
    let id = req.params.id;
    logger.trace("inside update category controller",id,updateCategoryObj);

    /* if(!updateCategoryObj.imgRes) {
        updateCategoryObj.imageName = '';
    }
    else if(updateCategoryObj.imgRes && updateCategoryObj.imgRes == 'onImageAdded') {
        updateCategoryObj.imageName = 'CAT' + id;
    } */

    if(updateCategoryObj.imgRes && updateCategoryObj.imgRes == 'onImageAdded') {
        updateCategoryObj.imageName = 'CAT' + id;
    }

    menuService.updateCategory(id,updateCategoryObj).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
    
}

const deleteCategory = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete category controller",id);
    menuService.deleteCategory(id).then(async (data)=>{

        let fileId = await gridFs.files.findOneAndDelete({filename: 'CAT' + id});
        if(fileId.value) {
          gridFs.db.collection('uploads.chunks').deleteMany({files_id: fileId.value._id});
        }

        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getItems = (req,res,next)=>{
    logger.trace("inside get options controller");
    
    let sortBy = req.query.sortBy ? ((req.query.sortBy == 'DESC') ? -1 : 1) : 1;
    let menuType = req.query.menuType ? req.query.menuType : 'online'; 
    
    menuService.getItems(req.payLoad.restaurantId, sortBy, menuType).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const getItem = (req,res,next)=>{
    let id = req.params.id
    logger.trace("inside get option by id controller",{id});
    menuService.getItem(id).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addItem = (req,res,next)=>{
    let itemDetails = req.body;
    itemDetails.restaurantId = req.payLoad.restaurantId;

    logger.trace("inside add item controller",itemDetails);
    //Add Item without Image
    if(!itemDetails.imgRes)
    {
        // Parse String Data Back to JSON object
        if(itemDetails.options) {
            itemDetails.options = JSON.parse(itemDetails.options);
        }
        // Parse String Data Back to JSON object
        if(itemDetails.variants) {
            itemDetails.variants = JSON.parse(itemDetails.variants);
        }

        menuService.addItem(itemDetails, req.payLoad.restaurantId).then(async (data)=>{

            await menuService.updateSequenceCounter('items', req.payLoad.restaurantId, null);
    
            io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
            res.status(200).json({"success":true, "data":data.msg});
            
        }).catch(err=>{
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    //Update Image File Name after adding Item
    else if(itemDetails.imgRes && itemDetails.imgRes == 'onImageAdded') 
    {
        menuService.updateMenuImage('ITEM', itemDetails.itemId).then(async (data) => {
            await menuService.updateSequenceCounter('items', req.payLoad.restaurantId, null);

            io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
            res.status(200).json({"success":true, "data":"item added successfully..."});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    //CLear garbage image and chunks on adding duplicate category 
    else if(itemDetails.imgRes && itemDetails.imgRes == 'onError') {
        gridFs.db.collection('fs.files').deleteMany({});
        gridFs.db.collection('fs.chunks').deleteMany({});
        
        res.status(404).json({success: false, message: `${itemDetails.name} already exists in this category`});
    }
    
}

const updateItem = (req,res,next)=>{
    let updateItemObj = req.body;
    let id = req.params.id;
    logger.trace("inside update item controller",id,updateItemObj);

    /* if(!updateItemObj.imgRes) {
        updateItemObj.imageName = '';
    }
    else if(updateItemObj.imgRes && updateItemObj.imgRes == 'onImageAdded') {
        updateItemObj.imageName = 'ITEM' + id;
    } */

    if(updateItemObj.imgRes && updateItemObj.imgRes == 'onImageAdded') {
        updateItemObj.imageName = 'ITEM' + id;
    }

    // Parse String Data Back to JSON object
    if(updateItemObj.options) {
        updateItemObj.options = JSON.parse(updateItemObj.options);
    }
    // Parse String Data Back to JSON object
    if(updateItemObj.variants) {
        updateItemObj.variants = JSON.parse(updateItemObj.variants);
    }

    menuService.updateItem(id,updateItemObj).then(async (data)=>{
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const deleteItem = (req,res,next)=>{
    let id = req.params.id;
    logger.trace("inside delete item controller",id);
    menuService.deleteItem(id).then(async (data)=>{

        let fileId = await gridFs.files.findOneAndDelete({filename: 'ITEM' + id});
        if(fileId.value) {
          gridFs.db.collection('uploads.chunks').deleteMany({files_id: fileId.value._id});
        }

        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateCategoryPosition = (req, res) => {
    
    let categories = {
        currCategory: req.body.currentCategory,
        targetCategory: req.body.targetCategory,
        currPosition: req.body.currentPosition,
        targetPosition: req.body.targetPosition,
    }
    
    let restaurantId = req.payLoad.restaurantId;

    menuService.updateCategoryPosition(categories, restaurantId).then(async (data) => {
        io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
        res.status(200).json({"success":true, "data":data});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateItemPosition = (req, res) => {

    logger.info('inside update item position controller...', req.body);

    let items = req.body.items;
    let startIndex = parseInt(req.body.startIndex), endIndex = parseInt(req.body.endIndex); 
    let restaurantId = req.payLoad.restaurantId;
    let filteredItems = [];

    // Shift Upward
    if(startIndex < endIndex) 
    {
        // Save Target Item
        let temp = items[endIndex].position;

        // Shift Item Position Upto Current Item
        for(let i = endIndex; i > startIndex; i--) {
            items[i].position = items[i - 1].position;
            filteredItems.push({id: items[i]._id, position: items[i].position});
        }

        items[startIndex].position = temp;
        filteredItems.push({id: items[startIndex]._id, position: items[startIndex].position});
    }
    // Shift Downward
    else if(startIndex > endIndex)
    {
        // Save Current Item
        let temp = items[endIndex].position;

        // Shift Item Position Upto Target Item
        for(let i = endIndex; i < startIndex; i++) {
            items[i].position = items[i + 1].position;
            filteredItems.push({id: items[i]._id, position: items[i].position});
        }

        items[startIndex].position = temp;
        filteredItems.push({id: items[startIndex]._id, position: items[startIndex].position});
    }

    logger.info('Items After Position Interchange...', filteredItems);

    if(filteredItems.length) 
    {
        menuService.updateItemPosition(filteredItems, restaurantId).then(async (data) => {
            io.sockets.in(req.payLoad.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(req.payLoad.restaurantId));
            res.status(200).json({"success":true, "data":data});
        })
        .catch(err => {
            logger.fatal(err);
            return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
        });
    }
    else {
        res.status(200).json({"success":true, "data": "'Item position updated successfully...'"});
    }
    
}

const getItemsForHomePage = (req,res,next)=>{
    logger.trace("inside get item for home page controller");
    let menuType = req.query.menuType ? req.query.menuType : 'online'; 
    menuService.getItemsForHomePage(req.params.id, menuType).then(data=>{
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const updateItemDiscount = (req, res) => {
    let itemData = req.body;
    let includedItems = [], excludedItems = [];

    logger.trace("inside update item discount...", itemData);

    itemData.items.forEach(item => {
        if(item.excludeDiscount == true) {
            excludedItems.push(item.id);
        }
        else {
            includedItems.push(item.id);
        }
    });

    menuService.updateItemDiscount(includedItems, excludedItems).then(data => {
        res.status(200).json({"success":true, "data":data});
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })

}

/* const updateMenuImage = (req, res) => {

    let option = req.body.imageType;
    let id = req.body.id;
    let imageType = (option == "item") ? "ITEM" : "CAT";
    if(!option){
        return res.status(404).json({"success":false,"message":"select an option category or item"});
    }

    logger.info('inside add menu image controller....', req.body);

    menuService.addMenuImage(imageType, id).then(async (data)=>{
        const fileName = imageType + req.params.id;

        gridFs.files.findOne({filename: fileName},((error, file) => {
            // Fetch image from GridFS Storage
            if (file.contentType == 'image/jpeg' || file.contentType == 'image/png' || file.contentType == 'image/jpg') {
                const readStream = gridFs.createReadStream(file.filename);
                const bufs = [];

                readStream.on('data', (chunk) => {
                    bufs.push(chunk);
                })

                readStream.on('end', () => {
                    const fbuf = Buffer.concat(bufs);
                    const base64Img = fbuf.toString('base64');

                    imageResponse = {status: "OK", imageType: imageType, imageData: base64Img};
					io.sockets.in(req.payLoad.restaurantId).emit('onImageChange', imageResponse);
                });
              
            }
        }));
        
        res.status(200).json({"success":true, "data":data});
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
} */

const downloadMenuImage = (req, res) => {
    let option = req.query.imageType;
    let id = req.query.id;
    if(!option){
        return res.status(err.code?err.code:404).json({"success":false,"message":"select an option category or item"});
    }
    logger.trace("inside download restaurant image controller", req.query);
    let imageType = (option == "item") ? "ITEM" : "CAT";
    menuService.downloadMenuImage(imageType, id).then(data=>{
        let imgFile;

        const fileName = imageType + id;
        gridFs.files.findOne({filename: fileName},((error, file) => {
            // If image not found in GridFS Storage use servers default
            if (error || !file) 
            {
                let tempFile = (imageType == "COVER") ? "cover.png" : "logo.png";
                imgFile = __dirname + "/../../server/images/"+ tempFile; 
                fs.readFile(imgFile, (err, data) => {
                    if(data) {
                        return res.status(200).download(imgFile);
                    }
                });
            }
            // Fetch image from GridFS Storage
            else if (file.contentType == 'image/jpeg' || file.contentType == 'image/png' || file.contentType == 'image/jpg') {
                const readStream = gridFs.createReadStream(file.filename);
                return readStream.pipe(res);
            } 
            else {
              res.json('File Not Found');
            }
        }));
    }).catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

module.exports = {
    addVariant,
    getVariants,
    getVariant,
    updateVariant,
    deleteVariant,
    getVariantGroups,
    getVariantGroup,
    addVariantGroup,
    updateVariantGroup,
    deleteVariantGroup,

    addTopping,
    getToppings,
    getTopping,
    updateTopping,
    deleteTopping,
    getToppingGroups,
    getToppingGroup,
    addToppingGroup,
    updateToppingGroup,
    deleteToppingGroup,

    addAllergy,
    getAllergies,
    getAllergy,
    updateAllergy,
    deleteAllergy,
    getAllergyGroups,
    getAllergyGroup,
    addAllergyGroup,
    updateAllergyGroup,
    deleteAllergyGroup,

    getOptions,
    getOption,
    addOption,
    updateOption,
    deleteOption,

    getCategories,
    getCategory,
    addCategory,
    updateCategory,
    deleteCategory,

    getItems,
    getItem,
    addItem,
    updateItem,
    deleteItem,
    getItemsForHomePage,
    updateCategoryPosition,
    updateItemPosition,
    updateItemDiscount,

    /* updateMenuImage, */
    downloadMenuImage,
}