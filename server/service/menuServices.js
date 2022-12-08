const logger = require('../../config/logger');
const models = require('../../models');
const mongoose = require('mongoose');

// For Variant and Groups
const getVariants = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get Variants service");
            let variants = await models.variant.aggregate([
                {$match: {restaurantId: id}},
                {$lookup: {
                    from: "variantgroups",
                    localField: "variantGroup",
                    foreignField: "_id",
                    as: "variantGroup"
                }},
                {$unwind: {
                    path: "$variantGroup",
                    preserveNullAndEmptyArrays: true
                }},
                {$lookup: {
                    from: "variants",
                    localField: "variantGroup.variants",
                    foreignField: "_id",
                    as: "variant"
                }},
                {
                    $project: {
                        _id: 1,
                        price: 1,
                        createdOn: 1,
                        isDeleted: 1,
                        restaurantId: 1,
                        name: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        variantGroups: {
                          _id: '$variantGroup._id',
                          name: '$variantGroup.name'  
                        },
                        variants: '$variant'
                    }
                }]
            );
            resolve(variants);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getVariant = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get Variant by id service");
            let variant = await models.variant.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(variant);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addVariant = (variantDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add Variant service",{variantDetails});
            var session = await models.variant.startSession();
            await session.startTransaction();
            await models.variant.insertMany(variantDetails,{ session });
            await session.commitTransaction();
            return resolve("Variant added successfully...");
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateVariant = (_id, updateVariantObj, restId) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update Variant service");
            let variant = await models.variant.findOneAndUpdate(
                {_id},
                updateVariantObj,
                {returnOriginal: false}
            ); 
            
            // Update Variants Data in Items
            let variantData = {
                "variants.$.name": updateVariantObj.name, 
                "variants.$.variantGroup": updateVariantObj.variantGroup,
                "variants.$.price": parseFloat(updateVariantObj.price)
            }
            
            await models.item.updateMany(
                {restaurantId: restId, "variants._id": _id},
                {$set: variantData}
            ); 

            return resolve(variant);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "Variant name already exists!!!" });
            }
            reject({ code:401, message: err.message });
        }
    })
}

const deleteVariant = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable Variant service");
            let variant = await models.variant.deleteOne(
                {_id},
            );     
            logger.debug(variant);
            if(!variant.deletedCount){
                return reject({code:422, message:"Variant not found"});
            }       
            return resolve("Variant deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getVariantGroups = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get Variant groups service");
            let variantGroups = await models.variantGroup.find(
                {restaurantId: id},
                {
                    __v:0
                }
            ).populate("variants");
            resolve(variantGroups);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getVariantGroup = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get Variant group by id service");
            let variantGroup = await models.variantGroup.findOne(
                {_id},
                {
                    __v:0
                }
            ).populate("variants");
            resolve(variantGroup);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addVariantGroup = (variantGroupDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add Variant group service",{variantGroupDetails});
            var session = await models.variantGroup.startSession();
            session.startTransaction();
            //-----------------------------------------------------------------------------------------
            if(!variantGroupDetails.variants.length){
                return reject({ code:422, message: "no Variant selected"});
            }
            else{
                let variants = await models.variant.find(
                    {_id:variantGroupDetails.variants,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(variants);
                if(variants && variants.length == variantGroupDetails.variants.length){
                    variantGroupDetails.variantIds = variantGroupDetails.variants.join(',');
                    variantGroupDetails.variants = variantGroupDetails.variants;
                }
                else{
                    return reject({ code:422, message: "invalid variant selected"});
                }
            }
            //-----------------------------------------------------------------------------------------
            await models.variantGroup.insertMany(variantGroupDetails,{ session });
            await session.commitTransaction();
            return resolve("Variant Group added successfully...");
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateVariantGroup = (_id,updateVariantGroupObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update variant group service",{updateVariantGroupObj});
            //-----------------------------------------------------------------------------------------
            if(updateVariantGroupObj.variants){//changes
                if(!updateVariantGroupObj.variants.length){
                    return reject({ code:422, message: "no variant selected"});
                }
                else{
                    let variants = await models.variant.find(
                        {_id:updateVariantGroupObj.variants,isDeleted:false},
                        {
                            isDeleted:0,
                            __v:0
                        }
                    );
                    logger.debug(variants);
                    if(variants && variants.length == updateVariantGroupObj.variants.length){
                        updateVariantGroupObj.variantIds = updateVariantGroupObj.variants.join(",");
                        updateVariantGroupObj.variants = variants;
                    }
                    else{
                        return reject({ code:422, message: "invalid topping selected"});
                    }
                }
            }
            
            //-----------------------------------------------------------------------------------------
            let variantGroup = await models.variantGroup.findOneAndUpdate(
                {_id},
                updateVariantGroupObj,
                {returnOriginal: false}
            ).populate('variants');
            logger.debug(variantGroup)        
            return resolve(variantGroup);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "Topping group already exists!!!" });
            }
            reject({ code:401, message: err.message });
        }
    })
}

const deleteVariantGroup = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable variant group service");
            let variantGroup = await models.variantGroup.deleteOne(
                {_id},
            );     
            logger.debug(variantGroup);
            if(!variantGroup.deletedCount){
                return reject({code:422, message:"Variant group not found"});
            }   
            return resolve("Variant group deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

// For Topping and Groups
const getToppings = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get toppings service");
            let toppings = await models.topping.find(
                {restaurantId: id},
                {
                    __v:0
                }
            );
            resolve(toppings);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getTopping = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get topping by id service");
            let topping = await models.topping.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(topping);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addTopping = (toppingDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add topping service",{toppingDetails});
            var session = await models.topping.startSession();
            await session.startTransaction();
            await models.topping.insertMany(toppingDetails,{ session });
            await session.commitTransaction();
            return resolve("Topping added successfully...");
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateTopping = (_id,updateToppingObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update topping service");
            let topping = await models.topping.findOneAndUpdate(
                {_id},
                updateToppingObj,
                {returnOriginal: false}
            );            
            return resolve(topping);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "Topping name already exists!!!" });
            }
            reject({ code:401, message: err.message });
        }
    })
}

const deleteTopping = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable topping service");
            let topping = await models.topping.deleteOne(
                {_id},
            );     
            logger.debug(topping);
            if(!topping.deletedCount){
                return reject({code:422, message:"Topping not found"});
            }       
            return resolve("Topping deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getToppingGroups = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get topping groups service");
            let toppingGroups = await models.toppingGroup.find(
                {restaurantId: id},
                {
                    __v:0
                }
            ).populate("toppings");
            resolve(toppingGroups);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getToppingGroup = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get topping group by id service");
            let toppingGroup = await models.toppingGroup.findOne(
                {_id},
                {
                    __v:0
                }
            ).populate("toppings");
            resolve(toppingGroup);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addToppingGroup = (toppingGroupDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add topping group service",{toppingGroupDetails});
            var session = await models.toppingGroup.startSession();
            session.startTransaction();
            //-----------------------------------------------------------------------------------------
            if(!toppingGroupDetails.toppings.length){
                return reject({ code:422, message: "no topping selected"});
            }
            else{
                let toppings = await models.topping.find(
                    {_id:toppingGroupDetails.toppings,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(toppings);
                if(toppings && toppings.length == toppingGroupDetails.toppings.length){
                    toppingGroupDetails.toppingIds = toppingGroupDetails.toppings.join(',');
                    toppingGroupDetails.toppings = toppingGroupDetails.toppings;
                }
                else{
                    return reject({ code:422, message: "invalid topping selected"});
                }
            }
            //-----------------------------------------------------------------------------------------
            await models.toppingGroup.insertMany(toppingGroupDetails,{ session });
            await session.commitTransaction();
            return resolve("Topping Group added successfully...");
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateToppingGroup = (_id,updateToppingGroupObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update topping group service",{updateToppingGroupObj});
            //-----------------------------------------------------------------------------------------
            if(updateToppingGroupObj.toppings){//changes
                if(!updateToppingGroupObj.toppings.length){
                    return reject({ code:422, message: "no topping selected"});
                }
                else{
                    let toppings = await models.topping.find(
                        {_id:updateToppingGroupObj.toppings,isDeleted:false},
                        {
                            isDeleted:0,
                            __v:0
                        }
                    );
                    logger.debug(toppings);
                    if(toppings && toppings.length == updateToppingGroupObj.toppings.length){
                        updateToppingGroupObj.toppingIds = updateToppingGroupObj.toppings.join(",");
                        updateToppingGroupObj.toppings = toppings;
                    }
                    else{
                        return reject({ code:422, message: "invalid topping selected"});
                    }
                }
            }
            
            //-----------------------------------------------------------------------------------------
            let toppingGroup = await models.toppingGroup.findOneAndUpdate(
                {_id},
                updateToppingGroupObj,
                {returnOriginal: false}
            ).populate('toppings');
            logger.debug(toppingGroup)        
            return resolve(toppingGroup);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "Topping group already exists!!!" });
            }
            reject({ code:401, message: err.message });
        }
    })
}

const deleteToppingGroup = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable topping group service");
            let toppingGroup = await models.toppingGroup.deleteOne(
                {_id},
            );     
            logger.debug(toppingGroup);
            if(!toppingGroup.deletedCount){
                return reject({code:422, message:"Topping group not found"});
            }   
            return resolve("Topping group deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

// Modules for Allergies 
const getAllergies = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get allergies service");
            let allergies = await models.allergy.find(
                {restaurantId: id},
                {
                    __v:0
                }
            );
            resolve(allergies);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getAllergy = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get allergy by id service");
            let allergy = await models.allergy.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(allergy);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addAllergy = (allergyDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add allergy service",{allergyDetails});
            var session = await models.allergy.startSession();
            await session.startTransaction();
            await models.allergy.insertMany([allergyDetails],{ session });
            await session.commitTransaction();
            return resolve("Allergy added successfully...");
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateAllergy = (_id,updateAllergyObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update allergy service");
            let allergy = await models.allergy.findOneAndUpdate(
                {_id},
                updateAllergyObj,
                {returnOriginal: false}
            );            
            return resolve(allergy);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "Allergy name already exists!!!" });
            }
            reject({ code:401, message: err.message });
        }
    })
}

const deleteAllergy = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable allergy service");
            let allergy = await models.allergy.deleteOne(
                {_id},
            );     
            logger.debug(allergy);
            if(!allergy.deletedCount){
                return reject({code:422, message:"Allergy not found"});
            }       
            return resolve("Allergy deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

// Modules for Allergy Groups
const getAllergyGroups = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get allergy groups service");
            let allergyGroups = await models.allergyGroup.find(
                {restaurantId: id},
                {
                    __v:0
                }
            ).populate("allergies");
            resolve(allergyGroups);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getAllergyGroup = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get allergy group by id service");
            let allergyGroup = await models.allergyGroup.findOne(
                {_id},
                {
                    __v:0
                }
            ).populate("allergies");
            resolve(allergyGroup);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addAllergyGroup = (allergyGroupDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add allergy group service",{allergyGroupDetails});
            var session = await models.allergyGroup.startSession();
            session.startTransaction();
            //-----------------------------------------------------------------------------------------
            if(!allergyGroupDetails.allergies.length){
                return reject({ code:422, message: "no allergy selected"});
            }
            else{
                let allergies = await models.allergy.find(
                    {_id:allergyGroupDetails.allergies,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(allergies);
                if(allergies && allergies.length == allergyGroupDetails.allergies.length){
                    allergyGroupDetails.allergyIds = allergyGroupDetails.allergies.join(',');
                    allergyGroupDetails.allergies = allergyGroupDetails.allergies;
                }
                else{
                    return reject({ code:422, message: "invalid allergy selected"});
                }
            }
            //-----------------------------------------------------------------------------------------
            await models.allergyGroup.insertMany(allergyGroupDetails,{ session });
            await session.commitTransaction();
            return resolve("Allergy Group added successfully...");
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateAllergyGroup = (_id,updateAllergyGroupObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update allergy group service",{updateAllergyGroupObj});
            //-----------------------------------------------------------------------------------------
            if(updateAllergyGroupObj.allergies){
                if(!updateAllergyGroupObj.allergies.length){
                    return reject({ code:422, message: "no allergy selected"});
                }
                else{
                    let allergies = await models.allergy.find(
                        {_id:updateAllergyGroupObj.allergies,isDeleted:false},
                        {
                            isDeleted:0,
                            __v:0
                        }
                    );
                    logger.debug(allergies);
                    if(allergies && allergies.length == updateAllergyGroupObj.allergies.length){
                        updateAllergyGroupObj.allergyIds = updateAllergyGroupObj.allergies.join(",");
                        updateAllergyGroupObj.allergies = allergies;
                    }
                    else{
                        return reject({ code:422, message: "invalid allergy selected"});
                    }
                }
            }
            
            //-----------------------------------------------------------------------------------------
            let allergyGroup = await models.allergyGroup.findOneAndUpdate(
                {_id},
                updateAllergyGroupObj,
                {returnOriginal: false}
            ).populate('allergies');
            logger.debug(allergyGroup)        
            return resolve(allergyGroup);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "Allergy group already exists!!!" });
            }
            reject({ code:401, message: err.message });
        }
    })
}

const deleteAllergyGroup = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable allergy group service");
            let allergyGroup = await models.allergyGroup.deleteOne(
                {_id},
            );     
            logger.debug(allergyGroup);
            if(!allergyGroup.deletedCount){
                return reject({code:422, message:"Allergy group not found"});
            }   
            return resolve("Allergy group deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOptions = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get option service");
            let options = await models.option.aggregate([
                {$match: {restaurantId: id}},
                {$lookup: {
                    from: "toppinggroups",
                    localField: "toppingGroup",
                    foreignField: "_id",
                    as: "toppingGroup"
                }},
                {$unwind: {
                    path: "$toppingGroup",
                    preserveNullAndEmptyArrays: true
                }},
                {$lookup: {
                    from:"toppings",
                    localField: "toppingGroup.toppings",
                    foreignField: "_id",
                    as: "topping"
                }},
                {
                    $project: {
                        _id: 1,
                        minToppings: 1,
                        maxToppings: 1,
                        createdOn: 1,
                        isDeleted: 1,
                        restaurantId: 1,
                        name: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        toppingGroups: {
                            _id: '$toppingGroup._id',
                            name: '$toppingGroup.name'
                        },
                        toppings: '$topping',
                    }
                }]
            );
            resolve(options);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getOption = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get option by id service");
            let option = await models.option.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(option);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addOption = (optionDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add option service",{optionDetails});
            var session = await models.option.startSession();
            session.startTransaction();
            await models.option.insertMany(optionDetails,{ session });
            await session.commitTransaction();
            return resolve("option added successfully...");
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateOption = (_id, updateOptionObj, restId) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update option service");
            let option = await models.option.findOneAndUpdate(
                {_id},
                updateOptionObj,
                {returnOriginal: false}
            );

            // Update Options Data in Items
            let optionData = {
                "options.$.name": updateOptionObj.name, 
                "options.$.toppingGroup": updateOptionObj.toppingGroup,
                "options.$.minToppings": parseInt(updateOptionObj.minToppings), 
                "options.$.maxToppings": parseInt(updateOptionObj.maxToppings)
            }
            
            await models.item.updateMany(
                {restaurantId: restId, "options._id": _id},
                {$set: optionData}
            );

            return resolve(option);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "option name already exists!!!" });
            }
            returnreject({ code:401, message: err.message });
        }
    })
}

const deleteOption = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable option service");
            let option = await models.option.deleteOne(
                {_id},
            );     
            logger.debug(option);
            if(!option.deletedCount){
                return reject({code:422, message:"option not found"});
            }       
            return resolve("option deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getCategories = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get categories service");
            let categories = await models.category.find(
                {restaurantId: id},
                {
                    __v:0
                }
            ).sort({position: 1});
            resolve(categories);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getCategory = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get category by id service");
            let category = await models.category.findOne(
                {_id},
                {
                    __v:0
                }
            );
            resolve(category);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addCategory = (categoryDetails, restId) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add category service",{categoryDetails});

            let seqResults = await models.sequenceCounter.findOne(
                {$and: [{restaurantId: restId, group: 'categories'}]},
                {sequence: 1, _id: 0}
            );
            
            let sequence = seqResults.sequence;
            console.log(sequence);

            categoryDetails.position = ++sequence; 

            /* for(let i = 0; i < categoryDetails.length; i++) {
                categoryDetails[i].position = ++sequence; 
            } */

            var session = await models.category.startSession();
            session.startTransaction();

            let isCatExists = await models.category.findOne(
                { $and: [{name: categoryDetails.name}, {restaurantId: categoryDetails.restaurantId}]}
            );
            if(isCatExists) {
                return reject({code:422, message: categoryDetails.name + " already exists"});
            }
            
            let catId = await models.category.insertMany([categoryDetails],{ session });
            await session.commitTransaction();
            return resolve({msg: "category added successfully...", seq: sequence, catId: catId[0]._id});
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateCategory = (_id,updateCategoryObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update category service");
            let category = await models.category.findOneAndUpdate(
                {_id},
                updateCategoryObj,
                {returnOriginal: false}
            );            
            return resolve(category);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "category name already exists!!!" });
            }
            return reject({ code:422, message: err.message });
        }
    })
}

const deleteCategory = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable category service");
            let category = await models.category.deleteOne(
                {_id},
            );     
            logger.debug(category);
            if(!category.deletedCount){
                return reject({code:422, message:"category not found"});
            }       
            return resolve("category deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const getItems = (id, sortBy = 1, menuType = 'online') => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get items service");
            let items = await models.item.aggregate(
                [
                    {$match: {restaurantId: id, menuType: menuType}},
                    {$sort: {position: 1}},
                    {$lookup: {
                        from:"categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category",
                    }},
                    {$unwind: {path: "$category"}},
                    {$sort: {"category.name": sortBy}},

                    /* {$lookup: {
                        from:"variantgroups",
                        localField: "variantGroup",
                        foreignField: "_id",
                        as: "variantGroup"

                    }},
                    { "$unwind": {
                        "path": "$variantGroup",
                        "preserveNullAndEmptyArrays": true
                    } },
            
                     {$lookup: {
                        from:"variants",
                        localField: "variantGroup.variants",
                        foreignField: "_id",
                        as: "variant"

                    }}, */

                    /* {$lookup: {
                        from:"toppinggroups",
                        localField: "toppingGroup",
                        foreignField: "_id",
                        as: "toppingGroup"

                    }},
                    { "$unwind": {
                        "path": "$toppingGroup",
                        "preserveNullAndEmptyArrays": true
                    } },
            
                     {$lookup: {
                        from:"toppings",
                        localField: "toppingGroup.toppings",
                        foreignField: "_id",
                        as: "topping"

                    }}, */

                    {$lookup: {
                        from:"allergygroups",
                        localField: "allergyGroup",
                        foreignField: "_id",
                        as: "allergyGroup"
                    }},
                    { "$unwind": {
                        "path": "$allergyGroup",
                        "preserveNullAndEmptyArrays": true
                    } },
                    {$lookup: {
                        from:"allergies",
                        localField: "allergyGroup.allergies",
                        foreignField: "_id",
                        as: "allergy"
                    }},

                    {
                        $project : {
                            _id  : 1,
                            options:1,
                            variants:1,
                            name:1,
                            price:1,
							description:1,
                            discount:1,
                            excludeDiscount:1,
                            position:1,
                            imageName:1,
                            /* variantGroups : {_id:'$variantGroup._id',
                                name:'$variantGroup.name',
                                price:'$variantGroup.price'
                            }, */
                            /* toppingGroups : {_id:'$toppingGroup._id',
                                name:'$toppingGroup.name',
                                price:'$toppingGroup.price'
                            }, */
                            allergyGroups: {_id: '$allergyGroup._id',
                                name: '$allergyGroup.name',
                                description: '$allergyGroup.description'
                            },
                            allergies: '$allergy',
                            /* variants: '$variant', */
                            /* toppings : '$topping', */
                            category:{
                                _id:'$category._id',
                                name:'$category.name',
                                position:'$category.position',
								description:'$category.description',
                                discount:'$category.discount',
                                excludeDiscount:'$category.excludeDiscount',
                            },
                        }
                    }
                ]
            );

            let toppings = await models.toppingGroup.aggregate([
                {$match: {restaurantId: id}},

                {$lookup: {
                    from: "toppings",
                    localField: "toppings",
                    foreignField: "_id",
                    as: "topping"
                }},

                {
                    $project: {
                        _id:1,
                        name:1,
                        toppings: "$topping"
                    }
                }
                
            ]);

            let variants = await models.variantGroup.aggregate([
                {$match: {restaurantId: id}},

                {$lookup: {
                    from: "variants",
                    localField: "variants",
                    foreignField: "_id",
                    as: "variant"
                }},

                {
                    $project: {
                        _id:1,
                        name:1,
                        variants: "$variant"
                    }
                }
                
            ]);

            //Map Topping with Options and Variant with SubVariants
            let filteredItems = [];
            for await (let item of items) 
            {
                item.options.map((option, i) => {
                    const topping = toppings.filter((topping) => {return topping._id.equals(option.toppingGroup)});
                    if(topping.length) {
                        //delete item.options[i].toppingGroup;
                        item.options[i]['toppings'] = topping[0].toppings;
                    }
                    else {
                        item.options[i]['toppings'] = [];
                    }
                });

                item.variants.map((variant, i) => {
                    const subVariant = variants.filter((subVar) => {return subVar._id.equals(variant.variantGroup)});
                    if(subVariant.length) {
                        //delete item.variants[i].variantGroup;
                        item.variants[i]['subVariants'] = subVariant[0].variants;
                    }
                    else {
                        item.variants[i]['subVariants'] = [];
                    }
                })

                logger.trace(item.options);
                filteredItems.push(item);
            }

            let objCreater = {};
			//logger.info("Inside get items....", items);
            if(items.length)
            {
                for await (let item of filteredItems)
                {
                    if(objCreater[item.category.name]) {
                        objCreater[item.category.name].push(item);        
                    }
                    else 
                    {
                        objCreater[item.category.name] = [];
                        objCreater[item.category.name].push(item);
                    }
                }
                let finalArray = [];
				//logger.trace('Inside Get Items Service....', objCreater);
                for await (let category of Object.keys(objCreater))
                {
                    let tempObj = {};
                    tempObj.name = category;
                    tempObj.items = objCreater[category];
                    finalArray.push(tempObj);
                }

				objCreater = finalArray;
            }
            else {
                objCreater = [];
            } 

            resolve(objCreater);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const getItem = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get item by id service");
            let items = await models.item.aggregate(
                [
                    {$match:{_id:mongoose.Types.ObjectId(_id)}},
                    {$lookup: {
                        from:"categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"

                    }},
                    {$unwind: "$category"},

                    /* {$lookup: {
                        from:"variantgroups",
                        localField: "variantGroup",
                        foreignField: "_id",
                        as: "variantGroup"

                    }},
                    { "$unwind": {
                        "path": "$variantGroup",
                        "preserveNullAndEmptyArrays": true
                    } },
                    {$lookup: {
                        from:"variants",
                        localField: "variantGroup.variants",
                        foreignField: "_id",
                        as: "variant"

                    }}, */
                    
                    /* {$lookup: {
                        from:"toppinggroups",
                        localField: "toppingGroup",
                        foreignField: "_id",
                        as: "toppingGroup"

                    }},
                    { "$unwind": {
                        "path": "$toppingGroup",
                        "preserveNullAndEmptyArrays": true
                    } },
                    {$lookup: {
                        from:"toppings",
                        localField: "toppingGroup.toppings",
                        foreignField: "_id",
                        as: "topping"

                    }}, */

                    {$lookup: {
                        from:"allergygroups",
                        localField: "allergyGroup",
                        foreignField: "_id",
                        as: "allergyGroup"
                    }},
                    { "$unwind": {
                        "path": "$allergyGroup",
                        "preserveNullAndEmptyArrays": true
                    } },
                    {$lookup: {
                        from:"allergies",
                        localField: "allergyGroup.allergies",
                        foreignField: "_id",
                        as: "allergy"
                    }},

                    {
                        $project : {
                            _id  : 1,
                            options:1,
                            variants:1,
                            name:1,
                            price:1,
							description:1,
                            discount:1,
                            excludeDiscount:1,
                            imageName:1,
                            /* variantGroups: "$variantGroup.name", */
                            /* toppingGroups : "$toppingGroup.name", */
                            allergyGroups: "$allergyGroup.name",
                            /* variants : "$variant", */
                            /* toppings : "$topping", */
                            category:"$category.name",
                        }
                    }
                ]
            )
            resolve(items);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const addItem = (itemDetails, restId) => {
    return new Promise(async (resolve, reject) => {
        try {
        
            logger.trace("inside add item service",{itemDetails});
            var session = await models.item.startSession();
            session.startTransaction();

            /* if(itemDetails.variantGroup){
                let variantGroup = await models.variantGroup.findOne(
                    {_id:itemDetails.variantGroup,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(variantGroup);
                if(!variantGroup){
                    return reject({ code:422, message: "invalid variant group selected"});
                }
            }
            else{
                itemDetails.variantGroup = null;
            } */

            /* if(itemDetails.toppingGroup){
                let toppingGroup = await models.toppingGroup.findOne(
                    {_id:itemDetails.toppingGroup,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(toppingGroup);
                if(!toppingGroup){
                    return reject({ code:422, message: "invalid topping group selected"});
                }
            }
            else{
                itemDetails.toppingGroup = null;
            } */

            if(itemDetails.allergyGroup){
                let allergyGroup = await models.allergyGroup.findOne(
                    {_id:itemDetails.allergyGroup,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(allergyGroup);
                if(!allergyGroup){
                    return reject({ code:422, message: "invalid allergy group selected"});
                }
            }
            else{
                itemDetails.allergyGroup = null;
            }

            if(itemDetails.category){
                let category = await models.category.findOne(
                    {_id:itemDetails.category,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(category);
                if(!category){
                    return reject({ code:422, message: "invalid category selected"});
                }
            }
            else{
                return reject({ code:422, message: "select a category"});
            }

            if(itemDetails.options)
            {
                let newOption = {};
                for await (let element of itemDetails.options){
                    newOption[element._id] = element.price;
                }
                logger.debug(newOption);
                let option = await models.option.find(
                    {_id:Object.keys(newOption),isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                option = JSON.parse(JSON.stringify(option));
                logger.debug(option);
                if(option && option.length != itemDetails.options.length){
                    return reject({ code:422, message: "invalid option selected"});
                }
                else{
                    for await(let element of option){
                        element.price = newOption[element._id];
                        logger.debug(element);
                    }
                    itemDetails.options = option;
                }
            }

            if(itemDetails.variants)
            {
                let newVariant = {};
                for await (let element of itemDetails.variants){
                    newVariant[element._id] = element.price;
                }
                logger.debug(newVariant);
                let variant = await models.variant.find(
                    {_id:Object.keys(newVariant),isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                variant = JSON.parse(JSON.stringify(variant));
                logger.debug(variant);
                if(variant && variant.length != itemDetails.variants.length){
                    return reject({ code:422, message: "invalid variant selected"});
                }
                else{
                    for await(let element of variant){
                        element.price = newVariant[element._id];
                        logger.debug(element);
                    }
                    itemDetails.variants = variant;
                }
            }
            logger.debug(itemDetails);

            let isItemExists = await models.item.findOne(
                    { $and: [{name: itemDetails.name}, {category: itemDetails.category}, 
                        {restaurantId: itemDetails.restaurantId}, {menuType: itemDetails.menuType}]}
                );

            if(isItemExists) {
                return reject({code:422, message: itemDetails.name + " already exists in this category"});
            }
            
            
            let seqResults = await models.sequenceCounter.findOne(
                            {$and: [{restaurantId: restId, group: 'items'}]},
                            {sequence: 1, _id: 0}
                        );
            
            itemDetails.position = ++seqResults.sequence;
            
            let itemId = await models.item.insertMany(itemDetails,{ session });
            await session.commitTransaction();
            return resolve({msg: "item added successfully...", itemId: itemId[0]._id});
        }
        catch (err) {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

const updateItem = (_id,updateItemObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update item service");

            /* if(updateItemObj.variantGroup){
                let variantGroup = await models.variantGroup.findOne(
                    {_id:updateItemObj.variantGroup,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(variantGroup);
                if(!variantGroup){
                    return reject({ code:422, message: "invalid variant group selected"});
                }
            }
            else{
                updateItemObj.variantGroup = null;
            } */

            /* if(updateItemObj.toppingGroup){
                let toppingGroup = await models.toppingGroup.findOne(
                    {_id:updateItemObj.toppingGroup,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(toppingGroup);
                if(!toppingGroup){
                    return reject({ code:422, message: "invalid topping group selected"});
                }
            }
            else{
                updateItemObj.toppingGroup = null;
            } */

            if(updateItemObj.allergyGroup){
                let allergyGroup = await models.allergyGroup.findOne(
                    {_id:updateItemObj.allergyGroup,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(allergyGroup);
                if(!allergyGroup){
                    return reject({ code:422, message: "invalid allergy group selected"});
                }
            }
            else{
                updateItemObj.allergyGroup = null;
            }

            if(updateItemObj.category){
                let category = await models.category.findOne(
                    {_id:updateItemObj.category,isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                logger.debug(category);
                if(!category){
                    return reject({ code:422, message: "invalid category selected"});
                }
            }
            if(updateItemObj.options){
                let newOption = {};
                for await (let element of updateItemObj.options){
                    newOption[element._id] = element.price;
                }
                logger.debug(newOption);
                let option = await models.option.find(
                    {_id:Object.keys(newOption),isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                option = JSON.parse(JSON.stringify(option));
                logger.debug(option);
                if(option && option.length != updateItemObj.options.length){
                    return reject({ code:422, message: "invalid option selected"});
                }
                else{
                    for await(let element of option){
                        element.price = newOption[element._id];
                        logger.debug(element);
                    }
                    updateItemObj.options = option;
                }
            }

            if(updateItemObj.variants){
                let newVariant = {};
                for await (let element of updateItemObj.variants){
                    newVariant[element._id] = element.price;
                }
                logger.debug(newVariant);
                let variant = await models.variant.find(
                    {_id:Object.keys(newVariant),isDeleted:false},
                    {
                        isDeleted:0,
                        __v:0
                    }
                );
                variant = JSON.parse(JSON.stringify(variant));
                logger.debug(variant);
                if(variant && variant.length != updateItemObj.variants.length){
                    return reject({ code:422, message: "invalid variant selected"});
                }
                else{
                    for await(let element of variant){
                        element.price = newVariant[element._id];
                        logger.debug(element);
                    }
                    updateItemObj.variants = variant;
                }
            }
            
            let item = await models.item.findOneAndUpdate(
                {_id},
                updateItemObj,
                {returnOriginal: false}
            );
            item = await getItem(_id);        
            return resolve(item);
        }
        catch (err) {
            logger.fatal(err);
            if(err.code == 11000){
                return reject({ code:422, message: "item name already exists!!!" });
            }
            return reject({ code:401, message: err.message });
        }
    })
}

const updateItemDiscount = (includedItems, excludedItems) => {
    return new Promise(async (resolve, reject) => {
        try 
        {
            logger.trace('inside update item discount...',includedItems, excludedItems);

            if(excludedItems.length) 
            {
                await models.item.updateMany(
                    {_id: {$in: excludedItems}},
                    {$set: {excludeDiscount: true}}
                );
            }
            
            if(includedItems.length)
            {
                await models.item.updateMany(
                    {_id: {$in: includedItems}},
                    {$set: {excludeDiscount: false}}
                );
            }

            resolve('item discount status updated successfuly...');
        }
        catch(err) 
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const deleteItem = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside disable item service");
            let item = await models.item.deleteOne(
                {_id},
            );     
            logger.debug(item);
            if(!item.deletedCount){
                return reject({code:422, message:"item not found"});
            }       
            return resolve("item deleted successfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getItemsForHomePage = (id, menuType = 'online') => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get category service");
            let items = await models.item.aggregate(
                [
                    {$match: {
                        $and: [{restaurantId: id}, {isActive: true}, {menuType: menuType}]
                    }},
                    {$sort: {position: 1}},
                    
                    {$lookup: {
                        from:"categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"

                    }},
                    {$unwind: "$category"},

                    /* {$lookup: {
                        from: "variantgroups",
                        localField: "variantGroup",
                        foreignField: "_id",
                        as: "variantGroup"
                        
                    }},
                    { "$unwind": {
                        "path": "$variantGroup",
                        "preserveNullAndEmptyArrays": true
                    }},
                    {$lookup: {
                        from: "variants",
                        localField: "variantGroup.variants",
                        foreignField: "_id",
                        as: "variant"
                    }}, */

                    /* {$lookup: {
                        from: "toppinggroups",
                        localField: "toppingGroup",
                        foreignField: "_id",
                        as: "toppingGroup"
                        
                    }},
                    { "$unwind": {
                        "path": "$toppingGroup",
                        "preserveNullAndEmptyArrays": true
                    }},
                    {$lookup: {
                        from: "toppings",
                        localField: "toppingGroup.toppings",
                        foreignField: "_id",
                        as: "topping"
                    }}, */

                    {$lookup: {
                        from:"allergygroups",
                        localField: "allergyGroup",
                        foreignField: "_id",
                        as: "allergyGroup"

                    }},
                    { "$unwind": {
                        "path": "$allergyGroup",
                        "preserveNullAndEmptyArrays": true
                    }},
                    {$lookup: {
                        from:"allergies",
                        localField: "allergyGroup.allergies",
                        foreignField: "_id",
                        as: "allergy"

                    }},
                    
                    {
                        $project : {
                            _id  : 1,
                            options:1,
                            variants:1,
                            name:1,
                            price:1,
							description:1,
                            discount:1,
                            excludeDiscount:1,
                            imageName:1,
                            /* variants: '$variant', */
                            /* toppings : '$topping', */
                            allergies: '$allergy',
                            category:{
                                _id:'$category._id',
                                name:'$category.name',
                                isActive:'$category.isActive',
								description:'$category.description',
                                discount:'$category.discount',
                                excludeDiscount:'$category.excludeDiscount',
                                position: '$category.position',
                                imageName: '$category.imageName'
                            },
                        }
                    }
                ]
            );

            let toppings = await models.toppingGroup.aggregate([
                {$match: {restaurantId: id}},

                {$lookup: {
                    from: "toppings",
                    localField: "toppings",
                    foreignField: "_id",
                    as: "topping"
                }},

                {
                    $project: {
                        _id:1,
                        toppings: "$topping"
                    }
                }
                
            ]);

            let variants = await models.variantGroup.aggregate([
                {$match: {restaurantId: id}},

                {$lookup: {
                    from: "variants",
                    localField: "variants",
                    foreignField: "_id",
                    as: "variant"
                }},

                {
                    $project: {
                        _id:1,
                        variants: "$variant"
                    }
                }
                
            ]);

            //Map Topping with Options and Variant with SubVariants
            let filteredItems = [];
            for await (let item of items) 
            {
                item.options.map((option, i) => {
                    const topping = toppings.filter((topping) => {return topping._id.equals(option.toppingGroup)});
                    if(topping.length) {
                        delete item.options[i].toppingGroup;
                        item.options[i]['toppings'] = topping[0].toppings;
                    }
                    else {
                        item.options[i]['toppings'] = [];
                    }
                });

                item.variants.map((variant, i) => {
                    const subVariant = variants.filter((subVar) => {return subVar._id.equals(variant.variantGroup)});
                    if(subVariant.length) {
                        delete item.variants[i].variantGroup;
                        item.variants[i]['subVariants'] = subVariant[0].variants;
                    }
                    else {
                        item.variants[i]['subVariants'] = [];
                    }
                })

                logger.trace(item.options);
                filteredItems.push(item);
            }

            let objCreater = {};
			//logger.info("Inside get items....", items);
            if(items.length)
            {
                for await (let item of filteredItems){
                    if(objCreater[item.category.name]) {
                        if(item.category.isActive) 
                        {
                            objCreater[item.category.name]['_id'] = item.category._id;
                            objCreater[item.category.name].push(item);
                            objCreater[item.category.name]['position'] = item.category.position;
                            objCreater[item.category.name]['discount'] = item.category.discount;
                            objCreater[item.category.name]['excludeDiscount'] = item.category.excludeDiscount;
                            objCreater[item.category.name]['imageName'] = item.category.imageName;
                        }
                        else {
                            delete objCreater[item.category.name];
                        }
                    }
                    else 
                    {
                        objCreater[item.category.name] = [];
                        if(item.category.isActive) 
                        {
                            objCreater[item.category.name]['_id'] = item.category._id;
                            objCreater[item.category.name].push(item)
                            objCreater[item.category.name]['position'] = item.category.position;
                            objCreater[item.category.name]['discount'] = item.category.discount;
                            objCreater[item.category.name]['excludeDiscount'] = item.category.excludeDiscount;
                            objCreater[item.category.name]['imageName'] = item.category.imageName;
                        }
                        else {
                            delete objCreater[item.category.name];
                        }
                    }
                }
                let finalArray = [];
				//logger.trace('Inside Get Items Service....', objCreater);
                for await (let category of Object.keys(objCreater)){
                    let tempObj = {};
                    tempObj._id = objCreater[category]['_id'];
                    tempObj.name = category;
                    tempObj.items = objCreater[category];
					tempObj.description = tempObj.items[0].category.description ? tempObj.items[0].category.description : null;
                    tempObj.position = objCreater[category]['position'];
                    tempObj.discount = objCreater[category]['discount'];
                    tempObj.excludeDiscount = objCreater[category]['excludeDiscount'];
                    tempObj.imageName = objCreater[category]['imageName']; 
                    finalArray.push(tempObj);
                }

				objCreater = finalArray.sort((a, b) => a.position - b.position);
				
            }
            else {
                objCreater = [];
            }
            resolve(objCreater);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const updateCategoryPosition = (categories, restId) => {
    
    return new Promise(async (resolve, reject) => {
        logger.info('inside update categories position.....', categories, restId);

        try
        {
            await models.category.findOneAndUpdate(
                {_id: categories.currCategory},
                {$set: {position: categories.targetPosition}}
            );

            await models.category.findOneAndUpdate(
                {_id: categories.targetCategory},
                {$set: {position: categories.currPosition}}
            );

            resolve('Category position updated successfully...');
        }
        catch(err) {
            logger.fatal(err);
            reject({code: 422, message: err.message});
        }
    });
}

const updateItemPosition = (items, restId) => {

    return new Promise(async (resolve, reject) => {
        logger.info('inside update items position.....', items, restId);

        try
        {
            let session = await models.item.startSession();
            session.startTransaction();

            for await(let item of items) {
                await models.item.updateOne({_id: item.id}, {position: item.position});
            }

            await session.commitTransaction();
            resolve('Item position updated successfully...');
        }
        catch(err) {
            logger.fatal(err);
            reject({code: 422, message: err.message});
        }
    });

}

const updateSequenceCounter = (group, restId, seq) => {

    return new Promise(async (resolve, reject) => {

        logger.info('inside update sequence counter....', group, restId);

        try
        {
            let sequenceC;
            
            if(group == 'items') 
            {
                sequenceC = await models.sequenceCounter.findOneAndUpdate(
                    {$and: [{restaurantId: restId, group: group}]},
                    {$inc: {sequence: 1}}
                );    
            }
            else
            {   
                sequenceC = await models.sequenceCounter.findOneAndUpdate(
                    {$and: [{restaurantId: restId, group: group}]},
                    {$set: {sequence: seq}}
                );
            } 
            

            logger.info('After updating.....' , sequenceC);
            
            resolve('sequence updated successfully...');
        }
        catch(err) {
            logger.fatal(err);
            reject({code: 422, message: err.message});
        }
    })
}

const updateMenuImage = (imageType, id) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside add menu image service..', imageType, id)
            if(imageType == 'ITEM') {
                await models.item.findOneAndUpdate({_id: id}, {$set: {imageName: imageType + id}});
                resolve('item image updated successfully...');
            }
            else if(imageType == 'CAT') {
                await models.category.findOneAndUpdate({_id: id}, {$set: {imageName: imageType + id}});
                resolve('category image updated successfully...');
            }
            else {
                resolve('please provide valid option');
            }
        }
        catch(err) {
            logger.fatal(err);
            reject({code: 422, message: err.message});
        }
    })
}

const downloadMenuImage = (imageType, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside download menu image service");

            let fileDetails;
            if(imageType == 'ITEM') {
                fileDetails = await models.item.findOne(
                    {_id: id},
                    {imageName: 1}
                );
            }
            else if(imageType == 'CAT') {
                fileDetails = await models.category.findOne(
                    {_id: id},
                    {imageName: 1}
                );
            }
            
            resolve(fileDetails);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
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
    getAllergyGroup,
    getAllergyGroups,
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
    updateSequenceCounter,
    updateCategoryPosition,
    updateItemPosition,
    updateItemDiscount,

    updateMenuImage,
    downloadMenuImage,
}