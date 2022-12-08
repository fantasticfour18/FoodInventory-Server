const logger = require('../../config/logger');
const cron = require('node-cron');
const moment = require('moment');
const models = require('../../models');
const menuService = require('../service/menuServices');
const { Parser } = require('json2csv');
const fs = require('fs');
const tasks = [];

const scheduleOldOrders = (monthsToLive) => {

    logger.info('Inside schedule old orders scheduler....');

    //Remove Previous Tasks if it exists
    let orderTaskIndex = null;

	for(let i = 0; i < tasks.length; i++) 
	{
		if(tasks[i].id == 'orderScheduler')
        {
            if(tasks[i].orderTask.status == 'scheduled') {
                tasks[i].orderTask.destroy();
                orderTaskIndex = i;
            }
		}
	}

    orderTaskIndex != null ? tasks.splice(orderTaskIndex, 1) : null;
    logger.info('Tasks Array After....', tasks);

    const currDate = moment();
    const deleteDate = currDate.add(monthsToLive, 'M');

    const time = `* * ${deleteDate.date()} ${deleteDate.month() + 1} *`;
    const t = `09 18 14 3 *`;
    tasks.push({id: 'orderScheduler', orderTask: cron.schedule(t, async() => {
        new Promise(async (resolve, reject) => {
            logger.info('Running task for deleting old orders...');

            try
            {
                // Get Orders creation time along with months difference
                const orders = await models.order.aggregate([
                    {$match: {restaurantId: '62148771e77a130023ba78ce'}}, //restId
                    {$project: {
                        monthsToLive: {
                            $dateDiff: {
                                startDate: '$createdOn',
                                endDate: new Date(deleteDate),
                                unit: 'month'
                            }
                        },
                        _id: 1,
                        orderNumber: 1,
                        userDetails: 1,
                        itemDetails: 1,
                        tip: 1,
                        deliveryCharge: 1,
                        discunt: 1,
                        orderStatus: 1,
                        note: 1,
                        deliveryType: 1,
                        paymentMode: 1,
                        orderTime: 1,
                        totalAmount: 1,
                        orderDateTime: 1

                    }}
                ]);

                logger.info(orders);
                
                // Add orders which is Ooder than specified month
                const deleteOrders = [];
                for await (let order of orders) {
                    if(order.monthsToLive >= monthsToLive) {
                        deleteOrders.push(order._id);
                    }
                }

                // Generate CSV here
                //const fields = ["_id", "monthsToLive"];
                //const parser = new Parser({fields});
                //const csv = parser.parse(deleteOrders);
                //logger.info('Generated csv--->', csv);
                fs.writeFile('orders.json', orders, (err) => {
                    if(err) {
                        logger.info('error writing file...');
                    }
                    else {
                        logger.info('file is saved...');
                    }
                    
                })

                // Delete old Orders
                /* if(deleteOrders.length) {
                    await models.order.deleteMany({_id: {$in: deleteOrders}});
                } */

                logger.trace('Task Completed...');
				resolve('task completed');

                // Reschedule same task for next orders
                /* if(deleteOrders.length) {
                    scheduleOldOrders(monthsToLive, restId)
                } */
            }
            catch(err)
            {
                logger.trace(err);
                reject('error');
            }

        });

    })});

    logger.info('task details--->', tasks);
}

module.exports = {scheduleOldOrders}