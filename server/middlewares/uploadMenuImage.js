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
      crypto.randomBytes(16, async (err, buff) => {
        if(err) {
          return(err);
        }

        let savedFileName;
        if(req.body.imageType == "item"){
          savedFileName = 'ITEM' + req.params.id;
        }
        else if(req.body.imageType == "category"){
          savedFileName = 'CAT' + req.params.id;
        }
        else{
         resolve({ code:200, message: "select option first!!!" });
        }

        //Check if image already exists, delete it and upload new
        let fileId = await gridFs.files.findOneAndDelete({filename: savedFileName});
        if(fileId.value) {
          gridFs.db.collection('uploads.chunks').deleteMany({files_id: fileId.value._id});
        }

        logger.info(req.params.id);
        const fileInfo = {
          filename: savedFileName,
          bucketName: 'uploads'
        };

        req.body.imgRes = 'onImageAdded';
        resolve(fileInfo);
      });
    });
  }
});

var uploadFile = multer({ storage: storage, fileFilter: imageFilter });
module.exports = uploadFile;