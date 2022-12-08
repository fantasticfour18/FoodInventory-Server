const logger = require('../../config/logger');
const cron = require('node-cron');
const models = require('../../models');
const restaurantService = require('../service/restaurantServices');
const moment = require('moment');
const tasks = [];

const scheduleTasks = (id, timeSlot) => {

	let openTaskIndex = null, closeTaskIndex = null;
	let restId = timeSlot.restaurantId;

	for(let i = 0; i < tasks.length; i++) 
	{
		if(tasks[i].slotId == id)
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

	logger.trace("inside Task Scheduler ", timeSlot);

	let openTime = timeSlot.openTime.split(':');
	let closeTime = timeSlot.closeTime.split(':');

	let days = '';
    for(let i = 0; i < timeSlot.days.length; i++)
	{
		days += i < (timeSlot.days.length - 1) ? timeSlot.days[i] + ',' : timeSlot.days[i]; 
	}
	
	let time;

	//Time Opening Task
	time = openTime[1] + ' ' + openTime[0] + ' * * ' + days;
	logger.trace("open time...", time);
	tasks.push({slotId: id, openTask: cron.schedule(time, async () => {

		new Promise (async (resolve, reject) => {

			console.log('running task for opening');

			try 
			{
				await models.restaurant.findOneAndUpdate(
					{_id: restId},
					{$set: {isOnline: true, openTime: timeSlot.openTime, closeTime: timeSlot.closeTime}}
				);

				// Check for Holiday Dates and Close the Restaurant
				let currDate = moment().format('DD/MM/YYYY');
				if(timeSlot.holidayDates.includes(currDate)) 
				{
					await models.restaurant.findOneAndUpdate(
						{_id: restId},
						{$set: {isOnline: false}}
					);
				}
		
				io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));

				logger.trace('Task Completed');
				resolve('task completed');
			}
			catch(err) 
			{
				logger.trace(err);
				reject('error');
			}

		});
	})});

	//Time Closing Task
	time = closeTime[1] + ' ' + closeTime[0] + ' * * ' + days;
	logger.trace("close time...", time);
	tasks.push({slotId: id, closeTask: cron.schedule(time, async () => {

		new Promise (async (resolve, reject) => {

			console.log('running task for closing');

			try 
			{
				await models.restaurant.findOneAndUpdate(
					{_id: restId},
					{$set: {isOnline: false}});
		
				io.sockets.in(restId).emit('refreshProfile', await restaurantService.getRestaurantProfile(restId));

				logger.trace('Task Completed');
				resolve('task completed');
			}
			catch(err) 
			{
				logger.trace(err);
				reject('error');
			}

		});
	})});

	logger.trace("tasks array ", tasks);

}

deleteTimeSlotScheduledTasks = (timeSlot) => {

    logger.info('...inside delete scheduled tasks.....')
    //Remove Previous Tasks if it exists
    let openTaskIndex = null, closeTaskIndex = null;

	for(let i = 0; i < tasks.length; i++) 
	{
		if(tasks[i].slotId.toString() == timeSlot._id.toString())
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

	openTaskIndex != null ? tasks.splice(openTaskIndex, 1) : null;
	closeTaskIndex != null ? tasks.splice(closeTaskIndex, 1) : null;
}

module.exports = {scheduleTasks, deleteTimeSlotScheduledTasks};