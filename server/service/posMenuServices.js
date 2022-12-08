const logger = require('../../config/logger');
const models = require('../../models');
const mongoose = require('mongoose');

// For POS Menus
const getPosMenus = (id) => {
    return new Promise(async (resolve, reject) => {
        try 
        {
            logger.trace("inside get POS items service");
            let items = await models.item.aggregate(
                [
                    {$match: {restaurantId: id}},
                    {$sort: {position: 1}},
                    {$lookup: {
                        from:"categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category",
                    }},
                    {$unwind: {path: "$category"}},

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
        catch (err) 
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const addPosMenus = (restId, menus) => {
    return new Promise(async (resolve, reject) => {
        try 
        {
            logger.trace("inside add item service",{menus});
            var session = await models.item.startSession();
            session.startTransaction();

            let sequences = await models.sequenceCounter.find({restaurantId: restId});
            let catSeq = sequences.find((seq) => seq.group == 'categories').sequence;
            let itemSeq = sequences.find((seq) => seq.group == 'items').sequence;

            
            let items = [];
            for await (let menu of menus)
            {
                let itemData = {};
                
                menu.restId = restId;

                //----------Category Check---------//
                let catResp = await checkCategory(menu, catSeq);
                let catId = catResp.catId;
                if(catResp.isNew) {
                    catSeq++;
                }
                
                //-----------Items Check-----------//
                for await (let item of menu.items)
                {
                    itemData = {
                        name: "",
                        category: "",
                        description: "",
                        price: 0,
                        position: null,
                        restaurantId: restId,
                        options: [],
                        variants: [],
                        allergyGroup: null
                    }

                    logger.info("Inside Items check loop--->", item);
                    let isItemExists = await models.item.findOne(
                        {
                            name: {$regex: item.name, $options: 'i'}, 
                            category: catId, 
                            restaurantId: restId
                    });
    
                    if(isItemExists) {
                        // Push list of items which already exists in category and return to client
                        // return reject({code:422, message: item.name + " already exists in this category"});
                    }
                    else
                    {
                        itemData.name = item.name;
                        itemData.category = catId;
                        itemData.description = item.description;
                        if(item.price) {
                            itemData.price = item.price;
                        }

                        //----------Allergies Check------------//
                        if(item.allergyGroupName) 
                        {
                            item.restId = restId;
                            itemData.allergyGroup = await checkAllergies(item);
                        }

                        //----------Options and Toppings Check------------//
                        let options = [];
                        if(item.options)
                        {
                            for await (let option of item.options)
                            {
                                option.restId = restId
                                let optData = await checkOptions(option);
                                options.push({
                                    _id: optData._id,
                                    name: optData.name,
                                    toppingGroup: optData.toppingGroup,
                                    minToppings: optData.minToppings,
                                    maxToppings: optData.maxToppings,
                                    createdOn: optData.createdOn,
                                    restaurantId: restId,
                                    createdAt: optData.createdAt,
                                    updatedAt: optData.updatedAt,
                                    price: option.price
                                });
                            }
                        }
                        
                        //----------Variants and SubVariants Check------------//
                        let variants = [];
                        if(item.variants)
                        {
                            for await (let variant of item.variants)
                            {
                                variant.restId = restId
                                let varData = await checkVariants(variant);
                                variants.push({
                                    _id: varData._id,
                                    name: varData.name,
                                    variantGroup: varData.variantGroup,
                                    createdOn: varData.createdOn,
                                    restaurantId: restId,
                                    createdAt: varData.createdAt,
                                    updatedAt: varData.updatedAt,
                                    price: varData.price
                                });
                            }
                        }
                        
                        itemData.options = options;
                        itemData.variants = variants;
                        itemData.position = ++itemSeq;
                        items.push(itemData);
                    }
                }
            }

            logger.info(items);

            let itemId = await models.item.insertMany(items,{ session });

            if(catSeq && itemSeq)
            {
                await models.sequenceCounter.updateOne(
                    {restaurantId: restId, group: 'categories'},
                    {$set: {sequence: catSeq}}
                );
                await models.sequenceCounter.updateOne(
                    {restaurantId: restId, group: 'items'},
                    {$set: {sequence: itemSeq}}
                );
            }
            
            await session.commitTransaction();
            return resolve({msg: "items added successfully..."});

            /* if(itemDetails.allergyGroup){
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

            if(itemDetails.options){
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

            if(itemDetails.variants){
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
                    { $and: [{name: itemDetails.name}, {category: itemDetails.category}, {restaurantId: itemDetails.restaurantId}]}
                );

            if(isItemExists) {
                return reject({code:422, message: itemDetails.name + " already exists in this category"});
            }
            
            
            let seqResults = await models.sequenceCounter.findOne(
                            {$and: [{restaurantId: restId, group: 'items'}]},
                            {sequence: 1, _id: 0}
                        );
            
            itemDetails.position = ++seqResults.sequence;
            
             */
        }
        catch (err) 
        {
            logger.fatal(err);
            await session.abortTransaction();
            if(err.code == 11000){
                return reject({ code:422, message: "duplicate entry found" });
            }
            reject({ code:422, message: err.message });
        }
    })
}

// Check for Allergies
const checkAllergies = (item) => {
    return new Promise(async (resolve, reject) => {
        // Check already existing allergies
        try
        {
            let allergyGroup, groupId;
            let allergies = [];
            for await (let allergy of item.allergies)
            {
                allergyGroup = await models.allergyGroup.findOne({
                    name: {$regex: item.allergyGroupName},
                    restaurantId: item.restId
                });

                let allgs = await models.allergy.findOne({
                    name: {$regex: allergy.name, $options: 'i'},
                    restaurantId: item.restId
                });
                logger.info('Inside Allergies loop Data---->', allgs);

                // If it is same
                if(allgs && allgs.name == allergy.name && allgs.description == allergy.description) {
                    allergies.push(allgs._id);
                }
                // If name is same but description is different
                else if(allgs && allgs.name == allergy.name && allgs.description != allergy.description)
                {
                    let allgy = await models.allergy.findOneAndUpdate(
                        {_id: allgs._id},
                        {$set: {description: allergy.description}},
                        {returnOriginal: false}
                    );

                    allergies.push(allgy._id);
                }
                // Create new allergy
                else
                {
                    allergy.restaurantId = item.restId;
                    let allgy = await models.allergy.insertMany([allergy]);
                    allergies.push(allgy[0]._id);
                }
            }

            // Add or Update allergy ids in group
            let allgyIds = []; 
            if(allergyGroup)
            { 
                allgyIds = allergyGroup.allergies.concat(allergies);
                allgyIds = allgyIds.filter((allgyId, i) => i == allgyIds.indexOf(allgyId));
                logger.info('inside Allergy Group update Data--->', allgyIds);

                let allgyGroup = await models.allergyGroup.findOneAndUpdate(
                    {_id: allergyGroup._id},
                    {
                        $set: {
                            allergies: allgyIds,
                            allergyIds: allgyIds.join(',')
                        }
                    },
                    {returnOriginal: false}
                );

                groupId = allgyGroup._id;
                resolve(groupId);
            }
            else
            {
                allgyIds = Array.from(new Set(allergies));

                let group = {
                    name: item.allergyGroupName,
                    allergies: allgyIds,
                    allergyIds: allgyIds.join(','),
                    restaurantId: item.restId
                };

                let allgyGroup = await models.allergyGroup.insertMany([group]);
                groupId = allgyGroup[0]._id;
                resolve(groupId);
            }
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

// Check for Category
const checkCategory = (cat, catSeq) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            const isCatExists = await models.category.findOne(
            {
                name: {$regex: cat.name, $options: 'i'}, 
                restaurantId: cat.restId
            });
    
            if(isCatExists) 
            {
                logger.info('Category Data--->', isCatExists);
                resolve({isNew: false, catId: isCatExists._id});
            }
            else 
            {
                cat.restaurantId = cat.restId;
                cat.position = ++catSeq;
                const newCat = await models.category.insertMany(cat);
                logger.info('Category Data--->', newCat);
                resolve({isNew: true, catId: newCat[0]._id});
            }
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

// Check for Options and Toppings
const checkOptions = (option) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            let opt = await models.option.findOne({
                name: {$regex: option.name, $options: 'i'},
                restaurantId: option.restId
            });
    
            logger.info('Option Data---->', opt);
            let groupId;
            let toppings = [];
    
            // Check if Topping Group already exists in option
            if(option.toppingGroupName) 
            {
                let toppingGroup;
                
                // Check for Toppings 
                for await (let topping of option.toppings)
                {
                    toppingGroup = await models.toppingGroup.findOne({
                        name: {$regex: option.toppingGroupName},
                        restaurantId: option.restId
                    });
    
                    let topps = await models.topping.findOne({
                        name: {$regex: topping.name, $options: 'i'},
                        restaurantId: option.restId
                    });
                    logger.info('Inside Toppings loop Data---->', topps);
    
                    // If it is same
                    if(topps && topps.name == topping.name && topps.price == topping.price) {
                        toppings.push(topps._id);
                    }
                    // If name is same but price is different
                    else if(topps && topps.name == topping.name && topps.price != topping.price)
                    {
                        let top = await models.topping.findOneAndUpdate(
                            {_id: topps._id},
                            {$set: {price: topping.price}},
                            {returnOriginal: false}
                        );
    
                        toppings.push(top._id);
                    }
                    // Create new topping
                    else
                    {
                        topping.restaurantId = option.restId;
                        let top = await models.topping.insertMany([topping]);
                        toppings.push(top[0]._id);
                    }
                }
                
                // Add or Update topping ids in group
                let toppIds = []; 
                if(toppingGroup)
                { 
                    toppIds = toppingGroup.toppings.concat(toppings);
                    toppIds = toppIds.filter((topId, i) => i == toppIds.indexOf(topId));
                    logger.info('inside Topping Group update Data--->', toppIds);
    
                    let topGroup = await models.toppingGroup.findOneAndUpdate(
                        {_id: toppingGroup._id},
                        {
                            $set: {
                                toppings: toppIds,
                                toppingIds: toppIds.join(',')
                            }
                        },
                        {returnOriginal: false}
                    );
    
                    groupId = topGroup._id;
                }
                else
                {
                    toppIds = Array.from(new Set(toppings));
    
                    let group = {
                        name: option.toppingGroupName,
                        toppings: toppIds,
                        toppingIds: toppIds.join(','),
                        restaurantId: option.restId
                    };
    
                    let topGroup = await models.toppingGroup.insertMany([group]);
                    groupId = topGroup[0]._id;
                }
            }
            else {
                groupId = null;
            }
    
            // Return final option
            if(opt) {
                opt.toppingGroup = groupId;
                resolve(opt);
            }
            else 
            {
                let newOpt = {
                    name: option.name,
                    toppingGroup: groupId,
                    restaurantId: option.restId
                };
    
                let optData = await models.option.insertMany([newOpt]);
                resolve(optData[0]);
            }
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

// Check for Variants and Sub Variants
const checkVariants = (variant) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            let varData = await models.variant.findOne({
                name: {$regex: variant.name, $options: 'i'},
                restaurantId: variant.restId
            });
    
            logger.info('Variant Data---->', varData);
            let groupId;
            let subVariants = [];
    
            // Check if Variant Group already exists in variant
            if(variant.variantGroupName) 
            {
                let variantGroup;
                
                // Check for Sub Variants 
                for await (let subVariant of variant.subVariants)
                {
                    variantGroup = await models.variantGroup.findOne({
                        name: {$regex: variant.variantGroupName},
                        restaurantId: variant.restId
                    });
    
                    let subVars = await models.variant.findOne({
                        name: {$regex: subVariant.name, $options: 'i'},
                        restaurantId: variant.restId
                    });
                    logger.info('Inside Sub Variants loop Data---->', subVars);
    
                    // If it is same
                    if(subVars && subVars.name == subVariant.name && subVars.price == subVariant.price) {
                        subVariants.push(subVars._id);
                    }
                    // If name is same but price is different
                    else if(subVars && subVars.name == subVariant.name && subVariant.price != subVariant.price)
                    {
                        let varts = await models.variant.findOneAndUpdate(
                            {_id: subVars._id},
                            {$set: {price: subVariant.price}},
                            {returnOriginal: false}
                        );
    
                        subVariants.push(varts._id);
                    }
                    // Create new sub variant
                    else
                    {
                        subVariant.restaurantId = variant.restId;
                        let varts = await models.variant.insertMany([subVariant]);
                        subVariants.push(varts[0]._id);
                    }
                }
                
                // Add or Update sub variant ids in group
                let subVarIds = []; 
                if(variantGroup)
                { 
                    subVarIds = variantGroup.variants.concat(subVariants);
                    subVarIds = subVarIds.filter((varId, i) => i == subVarIds.indexOf(varId));
                    logger.info('inside Variant Group update Data--->', subVarIds);
    
                    let varGroup = await models.variantGroup.findOneAndUpdate(
                        {_id: variantGroup._id},
                        {
                            $set: {
                                variants: subVarIds,
                                variantIds: subVarIds.join(',')
                            }
                        },
                        {returnOriginal: false}
                    );
    
                    groupId = varGroup._id;
                }
                else
                {
                    subVarIds = Array.from(new Set(subVariants));
    
                    let group = {
                        name: variant.variantGroupName,
                        variants: subVarIds,
                        variantIds: subVarIds.join(','),
                        restaurantId: variant.restId
                    };
    
                    let varGroup = await models.variantGroup.insertMany([group]);
                    groupId = varGroup[0]._id;
                }
            }
            else {
                groupId = null;
            }
    
            // Return final variant
            if(varData) {
                varData.variantGroup = groupId;
                resolve(varData);
            }
            else 
            {
                let newVar = {
                    name: variant.name,
                    variantGroup: groupId,
                    price: variant.price,
                    restaurantId: variant.restId
                };
    
                let newVarData = await models.variant.insertMany([newVar]);
                resolve(newVarData[0]);
            }
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

// Add Order from our database to MySQL POS
const pushOrder = (orderDetails) => {
    
}

module.exports = {
    getPosMenus,
    addPosMenus,
    pushOrder
}