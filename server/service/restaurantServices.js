const { ObjectID } = require('bson');
const logger = require('../../config/logger');
const models = require('../../models');

const addRestaurantProfile = (restaurantProfile) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add restaurant service",{restaurantProfile});
            await models.restaurant.insertMany(
                [restaurantProfile]
            );
            return resolve("restaurant added successfully...");
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

const getRestaurantProfile = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside get restaurant profile service");
            let restaurantProfile = await models.restaurant.findOne(
                {_id: id },
                {
                    _id: 0,
                    __v:0
                }
            );
            let ownerProfile = await models.owner.findOne(
                {_id: restaurantProfile.ownerId },
                {
                    _id:0,__v:0,password:0
                }
            )
            let timeSlots = await models.restTimeSlots.find({
                restaurantId: id
            })

            restaurantProfile = Object.assign(JSON.parse(JSON.stringify(ownerProfile)),JSON.parse(JSON.stringify(restaurantProfile)));
            restaurantProfile['timeSlots'] = timeSlots;

            resolve(restaurantProfile);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateRestaurantStatus = (id, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update restaurant status service",{status});
            await models.restaurant.findOneAndUpdate(
                {_id: id},
                {isOnline:status},
            );

            /* if(times) {
                await models.restaurant.findOneAndUpdate(
                    {ownerId: id},
                    {openTime: times.openTime, closeTime: times.closeTime}
                );
            } */

            if(status){
                return resolve("instance is online");
            }
            return resolve("instance is offline");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    });
}

const updateRestaurantDiscount = (id, discount) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update restaurant discount service",{discount});
            await models.restaurant.findOneAndUpdate(
                {_id: id},
                discount,
            );
            resolve("discount updated successfully");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateRestaurantPasscode = (passcode) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside update restaurant passcode service",{passcode});
            await models.restaurant.update(
                {},
                {passcode:passcode},
            );
            resolve("passcodes updated successfully");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const restaurantSetting = (id, restaurantDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside restaurant setting service",{restaurantDetails});
            restaurantDetails = await models.restaurant.findOneAndUpdate(
                {_id: id},
                { $set: restaurantDetails },
                {returnOriginal: false},
            );
            resolve(restaurantDetails);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addRestaurantImage = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            let fileDetails = req.file;
            let dataSet;
            if(req.body.option == "COVER"){
                dataSet = {image:fileDetails.filename}
            }
            else if(req.body.option == "ICON"){
                dataSet = {imageIcon:fileDetails.filename}
            }
            else{
                reject({ code:401, message: "select option first!!!" });
            }
            
            logger.trace("inside add restaurant image service", {fileDetails,dataSet});
            await models.restaurant.findOneAndUpdate(
                {_id: req.payLoad.restaurantId},
                dataSet,
            );
            resolve("image updated successfully");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const downloadRestaurantImage = (id, option) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside download restaurant image service");
            let project = (option == "COVER")?{image:1}:{imageIcon:1}
            let restaurantDetails = await models.restaurant.findOne(
                {_id: id},
                project
            );
            resolve(restaurantDetails);
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

//Modules for adding items or categories time slots
const getTimeZones = (id) => {

    return new Promise(async (resolve, reject) => {

        try
        {
            let zones = await models.timeZone.find({restaurantId: id}, {__v: 0, restaurantId: 0})

            resolve(zones);
        }
        catch(err)
        {
            logger.fatal(err);
            reject({message: err.message});
        }
    })
}

const addTimeZone = (zoneData) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside addItemsTimeZone services....', zoneData);

            let id = await models.timeZone.insertMany(
                [zoneData]
            )

            return resolve(id);
        }
        catch(err)
        {
            reject({ code:401, message: err.message });
        }
    })
}

const updateTimeZone = (id, timeZone) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside updateTimeZone Services....', id);

            let zones = await models.timeZone.findOneAndUpdate(
                {_id: id},
                {$set: timeZone}
            )

            resolve('Time Zone updated successfully...');

        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })

}

const updateTimeZoneStatus = (id, status) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            let zone = await models.timeZone.findOneAndUpdate(
                {_id: id},
                {$set: {isActive: status}}
            )
            
            logger.info(zone);
            if(!zone) {
                return reject({code:422, message:"Time Zone not found"});
            }

            return resolve({msg: "Time Zone updated successfully...", zone: zone});
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const deleteTimeZone = (zoneData) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside deleteTimeZone servies....', zoneData);

            let zone = await models.timeZone.findOneAndDelete(
                {_id: zoneData.id}
            )
            
            logger.info(zone);
            if(!zone) {
                return reject({code:422, message:"Time Zone not found"});
            }

            return resolve({msg: "Time Zone deleted successfully...", zone: zone});
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const updateItemsStatus = (zoneData, status) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside update items status...');

            if(zoneData.zoneGroup == "items")
            {
                logger.info('inside update items status...zonegroup items');
                
                let items = [];
                zoneData.items.forEach(item => {
                    items.push(item.id);
                });

                await models.item.updateMany(
                    {_id: {$in: items}},
                    {$set: {isActive: status}}
                )

                resolve('Item Status Updated Successfuly...');
            }
            else if(zoneData.zoneGroup == "categories")
            {
                logger.info('inside update items status...zonegroup categories');

                let categories = [];
                zoneData.items.forEach(category => {
                    categories.push(category.id);
                });

                await models.category.updateMany(
                    {_id: {$in: categories}},
                    {$set: {isActive: status}}
                )

                resolve('Item Status Updated Successfuly...');
            }
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })

}

//Modules for restaurant opening and closing time slots
const getTimeSlots = (id) => {

    return new Promise(async (resolve, reject) => {

        try
        {
            let slots = await models.restTimeSlots.find({restaurantId: id}, {__v: 0, restaurantId: 0})

            resolve(slots);
        }
        catch(err)
        {
            logger.fatal(err);
            reject({message: err.message});
        }
    })

}

const addTimeSlot = (timeSlot, restId) => {

    return new Promise(async (resolve, reject) => {

        logger.info('inside addItemsTimeZone services....', timeSlot);

        try
        {
            let existingSlots = await models.restTimeSlots.find({restaurantId: restId});

            let id = await models.restTimeSlots.insertMany([timeSlot]);

            return resolve({slotId: id, existingSlots: existingSlots});

        }
        catch(err)
        {
            logger.fatal(err);
            reject({code: 422, message: err.message});
        }
    })
}

const updateTimeSlot = (id, timeSlot) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside updateTimeSlot Services....', id);

            await models.restTimeSlots.findOneAndUpdate(
                {_id: id},
                {$set: timeSlot}
            )

            let slots = await models.restTimeSlots.find({restaurantId: timeSlot.restaurantId});

            resolve(slots);

        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })

}

const updateTimeSlotStatus = (id, status, restId) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('...inside update time slots status service....');

            let slot = await models.restTimeSlots.findOneAndUpdate(
                {_id: id},
                {$set: {isActive: status}}
            )

            let slots = await models.restTimeSlots.find({restaurantId: restId});

            resolve({msg: 'time slot status updated successfully...', slots: slots, updatedSlot: slot});
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const deleteTimeSlot = (id, restId) => {

    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside deleteTimeSlot servies....', id, restId);

            let slot = await models.restTimeSlots.findOneAndDelete(
                {_id: id}
            )

            let slots = await models.restTimeSlots.find({restaurantId: restId});
            
            logger.info(slot);
            if(!slot) {
                return reject({code:422, message:"Time Slot not found"});
            }

            return resolve({msg: "Time Slot deleted successfully...", slots: slots, deletedSlot: slot});
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:422, message: err.message });
        }
    })
}

const getRestDistance = (restId) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            let distDetails = await models.restaurant.findOne(
                {_id: restId},
                {distanceDetails: 1, acceptedPostcodes: 1}
            );

            resolve ({distDetails: distDetails.distanceDetails, acceptedPostcodes: distDetails.acceptedPostcodes});
           
        }
        catch(err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const addRestDistance = (distanceData,restId) => {
    return new Promise(async (resolve, reject) => {
        try {
            distanceData['id'] = new ObjectID();
            logger.trace("inside add restaurant distance service",{distanceData});
            
            const postcode = await models.restaurant.findOne(
                {_id: restId, "distanceDetails.postcode": distanceData.postcode}
            );

            if(!postcode) {
                await models.restaurant.findOneAndUpdate(
                    {_id: restId},
                    {$push: {distanceDetails: distanceData, acceptedPostcodes: distanceData.postcode}}
                );

                resolve ("Postcode added sucessfully...");
            }
            else {
                reject({message: "Postcode already exist.."});
            }
           
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateRestDistance = (distanceData, acceptedPostcodes, restId) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.info('inside update rest detials body data...', distanceData);

            await models.restaurant.findOneAndUpdate(
                {_id: restId},
                {distanceDetails: distanceData, acceptedPostcodes: acceptedPostcodes}
            );

            resolve ("Postcode updated sucessfully...");
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateOnlineOrdering = (restId, orderType) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside update online ordering...', orderType);

            await models.restaurant.findOneAndUpdate(
                {_id: restId},
                orderType
            );

            resolve ("updated sucessfully");
        }
        catch(err) 
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const getCategoryPrinters = (restId) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside get category printers...', restId);

            const printers = await models.printer.findOne(
                {restaurantId: restId},
                {__v: 0}
            );

            resolve (printers);
        }
        catch(err) 
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateCategoryPrinters = (restId, printers) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('inside update category printers...', restId);

            const isPrinterFound = await models.printer.findOne(
                {restaurantId: restId}
            );

            if(isPrinterFound) 
            {
                await models.printer.updateOne(
                    {restaurantId: restId},
                    {printers: printers}
                );
            }
            else
            {
                await models.printer.insertMany([
                    {
                        restaurantId: restId,
                        printers: printers
                    }
                ]);
            }

            resolve('printers saved successfully....');
        }
        catch(err) 
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const updateRestTable = (restId, tableNumber) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('Inside update rest table service....');
            let tables = await models.restaurant.findOne({_id: restId}, {tableDetails: 1, _id: 0});

            if(tables.tableDetails.length) 
            {
                if(!tables.tableDetails.some(t => t.table == tableNumber)) {
                    await models.restaurant.findOneAndUpdate(
                        {_id: restId},
                        {$push: {tableDetails: {table: tableNumber, status: "VACANT"}}}
                    );
                }
            }
            else {
                await models.restaurant.findOneAndUpdate(
                    {_id: restId},
                    {$push: {tableDetails: {table: tableNumber, status: "VACANT"}}}
                );
            }

            resolve("Table Number added successfully");
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const deleteRestTable = (restId, tableNumber) => {
    return new Promise(async (resolve, reject) => {
        try
        {
            logger.info('Inside delete rest table service....');
            await models.restaurant.updateOne(
                {_id: restId},
                {$pull: {"tableDetails": {table: tableNumber}}}
            );

            resolve("Table deleted successfully");
        }
        catch(err)
        {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

module.exports = {
    addRestaurantProfile,
    getRestaurantProfile,
    updateRestaurantStatus,
    updateRestaurantDiscount,
    updateRestaurantPasscode,
    addRestaurantImage,
    downloadRestaurantImage,
    restaurantSetting,
    getTimeZones,
    addTimeZone,
    updateTimeZone,
    updateTimeZoneStatus,
    deleteTimeZone,
    updateItemsStatus,
    getTimeSlots,
    addTimeSlot,
    updateTimeSlot,
    updateTimeSlotStatus,
    deleteTimeSlot,
    getRestDistance,
    addRestDistance,
    updateRestDistance,
    updateOnlineOrdering,
    getCategoryPrinters,
    updateCategoryPrinters,
    updateRestTable,
    deleteRestTable
}