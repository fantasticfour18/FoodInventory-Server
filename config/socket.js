'use strict'
const logger = require('./logger')

const configure = async (app, server) => {
    logger.debug('settings:socket:configure')
	
    const io = require('socket.io')(server, {
        cors: {
          origin: '*'
        }
      });
	
    app.set('io', io)
    global.io = io;
	
    io.on('connection', (socket) => {
        logger.info(`User connected: ${socket.id}`)
		
		//For users events restuarant change and menus
        socket.on('joinRoom', restaurantId => {
			logger.info('user joined room', restaurantId);
            socket.join(restaurantId)
        })

        socket.on('leaveRoom', restaurantId => {
			logger.info('user leaved room', restaurantId);
            socket.leave(restaurantId)
        })
		
		//For Emiting Orders Event Accept and Decline
		 socket.on('onOrderStatusEnter', orderId => {
			logger.info('user placed order on enter', orderId);
            socket.join(orderId);
        })

        socket.on('onOrderStatusLeave', orderId => {
			logger.info('user left order on leave', orderId);
            socket.leave(orderId);
        })
        
		//For Emiting Events order placed in Owner App
        socket.on('joinOwner', ownerMailId => {
			logger.info('owner joined', ownerMailId);
            socket.join(ownerMailId);
        })
        
        socket.on('leaveOwner', ownerMailId => {
            socket.leave(ownerMailId);
        })

        //For Admin Events
        socket.on('onAdminEnter', adminId => {
            logger.info('Admin Entered....', adminId);
            socket.join(adminId);
        })

        socket.on('onAdminLeave', adminId => {
            logger.info('Admin Left....', adminId);
            socket.leave(adminId);
        })

        socket.on('disconnect', () => {
            logger.info(`User disconnect: ${socket.id}`)
        })
    })

    logger.info('socket configured successfully')
}

exports.configure = configure
