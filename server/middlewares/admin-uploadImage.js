const multer = require("multer");
const { GridFsStorage } = require('multer-gridfs-storage');
const { mongoUri } = require("../../config/serverConfig");
const crypto = require('crypto');
const logger = require('../../config/logger');

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
      crypto.randomBytes(16, (err, buff) => {
        if(err) {
          return(err);
        }

        let savedFileName;
        
        req.payLoad.restaurantId = req.params.id;
        if(req.body.option == "COVER"){
          savedFileName = 'COVER' + req.params.id;
        }
        else if(req.body.option == "ICON"){
          savedFileName = 'ICON' + req.params.id;
        }
        else{
         resolve({ code:200, message: "select option first!!!" });
        }

        gridFs.files.deleteOne({filename: savedFileName});

        logger.info(req.body);
        const fileInfo = {
          filename: savedFileName,
          bucketName: 'uploads'
        };

        
        resolve(fileInfo);
      });
    });
  }
});

var uploadFile = multer({ storage: storage, fileFilter: imageFilter });
module.exports = uploadFile;