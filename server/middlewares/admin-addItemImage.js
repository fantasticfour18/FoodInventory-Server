const multer = require("multer");
const { GridFsStorage } = require('multer-gridfs-storage');
const { mongoUri } = require("../../config/serverConfig");
const crypto = require('crypto');
const logger = require('../../config/logger');
const models = require('../../models');
const menuService = require('../service/menuServices');

const imageFilter = (req, file, cb) => {
  if (file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
    cb(null, true);
  } else {
    cb("Please upload only image file.", false);
  }
};

/* var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname+"/../../server/images");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, `${Date.now()}-bezkoder-${file.originalname}`);
  },
}); */

const storage = new GridFsStorage({
  url: mongoUri,
  file: (req, file) => {
    return new Promise((resolve, reject, next) => {
      crypto.randomBytes(16, async (err, buff) => {
        if(err) {
          return(err);
        }

        logger.info('Inside Upload Image....', req.body);

        let itemDetails = req.body;
        itemDetails.restaurantId = req.params.id;

        // Parse String Data Back to JSON object
        if(itemDetails.allergyGroup == 'null') {
          itemDetails.allergyGroup = JSON.parse(itemDetails.allergyGroup);
        }
    
        if(itemDetails.description == 'null') {
          itemDetails.description = JSON.parse(itemDetails.description);
        }
          
        itemDetails.options = JSON.parse(itemDetails.options);
        itemDetails.variants = JSON.parse(itemDetails.variants);
        itemDetails.price = JSON.parse(itemDetails.price);

        logger.info('inside add Item Image Middleware.....->', itemDetails);

        await menuService.addItem(itemDetails, req.params.id).then(itemResp => {

          let savedFileName = 'ITEM' + itemResp.itemId;
          const fileInfo = {
            filename: savedFileName,
            bucketName: 'uploads'
          };

          req.body.imgRes = 'onImageAdded';
          req.body.itemId = itemResp.itemId;
          resolve(fileInfo); 
        })
        .catch(err => {
          logger.fatal(err);
          req.body.imgRes = 'onError';
          resolve({success: false, message: 'duplicate entry found'});
        });
        
      });
    });
  }
});

var uploadFile = multer({ storage: storage, fileFilter: imageFilter });
module.exports = uploadFile;