const logger = require('../../config/logger');
const cron = require('node-cron');
const models = require('../../models');
const menuService = require('../service/menuServices');
const tasks = [];

const scheduleItems = (timeZone, id) => {

    logger.info('inside items scheduler....', timeZone.zoneGroup);
    logger.info('inside items scheduler....', timeZone);
    logger.info('inside items scheduler....', id);

    //Remove Previous Tasks if it exists
    let openTaskIndex = null, closeTaskIndex = null;

	for(let i = 0; i < tasks.length; i++) 
	{
		if(tasks[i].zoneId == id)
        {
            if(tasks[i].openTask && tasks[i].openTask.status == 'scheduled') {
                tasks[i].openTask.destroy();
                openTaskIndex = i;
            }
            else if(tasks[i].closeTask && tasks[i].closeTask.status == 'scheduled') {
                tasks[i].closeTask.destroy();
                closeTaskIndex = i;
            }	
		}
	}

    openTaskIndex != null ? tasks.splice(openTaskIndex, 1) : null;
	closeTaskIndex != null ? tasks.splice(closeTaskIndex, 1) : null;
    logger.info('Tasks Array After....', tasks);


    let items = []
    timeZone.items.forEach(item => {
        items.push(item.id);
    });

    let categories = [];
    if(timeZone.zoneGroup == 'items') 
    {
        timeZone.items.forEach(item => {
            categories.push(item.categoryId);
        })

        categories = Array.from(new Set(categories));
        logger.info('Categories.....', categories);
    }

    let days = '';
    for(let i = 0; i < timeZone.days.length; i++)
	{
		days += i < (timeZone.days.length - 1) ? timeZone.days[i] + ',' : timeZone.days[i]; 
	}

    logger.info('items.....', items);
    logger.info('days....', days);

    let openTime = timeZone.startTime.split(':');
	let closeTime = timeZone.endTime.split(':');
    let time;

    //Set task for opening
    time = openTime[1] + ' ' + openTime[0] + ' * * ' + days;
    logger.trace("open time...", time);
    tasks.push({zoneId: id, openTask: cron.schedule(time, async () => {

        new Promise(async (resolve, reject) => {

            logger.info('running task for items opening...');

            try
            {
                if(timeZone.zoneGroup == 'categories')
                {
                    await models.category.updateMany(
                        {_id: {$in: items}},
                        {$set: {isActive: true}}
                    );
                    
                    /*
                    await models.item.updateMany(
                        {category: {$in: items}},
                        {$set: {isActive: true}}
                    )*/
                }
                else if(timeZone.zoneGroup == 'items')
                {   
                    await models.item.updateMany(
                        {_id: {$in: items}},
                        {$set: {isActive: true}}
                    );
                    
                    /*
                    await models.category.updateMany(
                        {_id: {$in: categories}},
                        {$set: {isActive: true}}
                    )*/
                }

                io.sockets.in(timeZone.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(timeZone.restaurantId));

                logger.trace('Task Completed');
				resolve('task completed');
            }
            catch(err)
            {
                logger.trace(err);
				reject('error');
            }
        })
    })})

    //Set task for closing
    time = closeTime[1] + ' ' + closeTime[0] + ' * * ' + days;
    logger.trace("close time...", time);
    tasks.push({zoneId: id, closeTask: cron.schedule(time, async () => {

        new Promise(async (resolve, reject) => {

            logger.info('running task for items closing...');

            try
            {
                if(timeZone.zoneGroup == 'categories')
                {
                    await models.category.updateMany(
                        {_id: {$in: items}},
                        {$set: {isActive: false}}
                    );
                }
                else if(timeZone.zoneGroup == 'items')
                {
                    await models.item.updateMany(
                        {_id: {$in: items}},
                        {$set: {isActive: false}}
                    );
                }

                io.sockets.in(timeZone.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(timeZone.restaurantId));

                logger.trace('Task Completed');
				resolve('task completed');
            }
            catch(err)
            {
                logger.trace(err);
				reject('error');
            }
        })
    })})

}

deleteScheduledTasks = (timeZone) => {

    logger.info('...inside delete scheduled tasks.....');
    //Remove Previous Tasks if it exists
    let openTaskIndex = null, closeTaskIndex = null;

	for(let i = 0; i < tasks.length; i++) 
	{
		if(tasks[i].zoneId.toString() == timeZone._id.toString())
        {
            if(tasks[i].openTask && tasks[i].openTask.status == 'scheduled')
            {
                tasks[i].openTask.destroy();
			    openTaskIndex = i;
            }
            else if(tasks[i].closeTask && tasks[i].closeTask.status == 'scheduled')
            {
                tasks[i].closeTask.destroy();
			    closeTaskIndex = i;
            }
        }
	}
    logger.info(tasks);

	openTaskIndex != null ? tasks.splice(openTaskIndex, 1) : null;
	closeTaskIndex != null ? tasks.splice(closeTaskIndex, 1) : null;

    let items = []
    timeZone.items.forEach(item => {
        items.push(item.id);
    });

    return new Promise(async (resolve, reject) => {

        try
        {
            if(timeZone.zoneGroup == 'categories')
            {
                await models.category.updateMany(
                    {_id: {$in: items}},
                    {$set: {isActive: true}}
                );
            }
            else if(timeZone.zoneGroup == 'items')
            {
                await models.item.updateMany(
                    {_id: {$in: items}},
                    {$set: {isActive: true}}
                );
            }

            io.sockets.in(timeZone.restaurantId).emit('refreshHome', await menuService.getItemsForHomePage(timeZone.restaurantId));
            resolve('timeZone deleted successfully');
        }
        catch(err)
        {
            logger.trace(err);
			reject('error');
        }
    })
}

module.exports = {scheduleItems, deleteScheduledTasks}