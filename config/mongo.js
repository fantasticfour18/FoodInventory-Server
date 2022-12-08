var mongoose = require('mongoose');
var util = require('util')
const config = require('./serverConfig');
const logger = require('./logger');
const grid = require('gridfs-stream');
const models = require('../models');
const { scheduleTasks } = require('../server/scheduler/resStatusScheduler');

var mongoDB = config.mongoUri;
var mongoDebug = config.mongoDebug;
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  const gridFs = grid(db.db, mongoose.mongo);
  gridFs.collection('uploads');
  global.gridFs = gridFs;
  logger.debug("connected to mongo");
  
  // Schedule all restaurant working time tasks 
  /* const slots = await models.restTimeSlots.find({});
  logger.info("Slots--->", slots);

  for await (let slot of slots) {
    if(slot.isActive) {
      scheduleTasks(slot._id, slot);
    }
  } */

});

if(true){
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.log(`MONGO SHELL>>>-- ${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}
module.exports = db;