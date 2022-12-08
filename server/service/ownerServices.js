const logger = require('../../config/logger');
const models = require('../../models');
const multer = require('multer');
const path = require('path');

const addOwner = (ownerData) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside add owner service",{ownerData});
            await models.owner.insertMany(
                [ownerData]
            );
            return resolve("owner added successfully...");
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

const ownerLogin = (ownerCreds) => {
    logger.trace("inside owner login", { ownerCreds });
    return new Promise(async (resolve, reject) => {
        try 
        {
            let condition = {
                email: ownerCreds.email,
            }
            let ownerData = await models.owner.findOneAndUpdate(
                condition,
                {
                    deviceToken:ownerCreds.deviceToken?ownerCreds.deviceToken:null,
                    appVersion:ownerCreds.appVersion?ownerCreds.appVersion:null,
                    deviceType:ownerCreds.deviceType?ownerCreds.deviceType:null,
                },
                {returnOriginal: false}
            );
            logger.debug({ownerData});

            if (ownerData) {
                if (ownerData.password == ownerCreds.password) {
                    let restaurantData = await models.restaurant.findOne(
                        {_id: ownerData.restaurantId },
                        {
                            _id: 0,
                            __v: 0,
                        }
                    ).exec();
                    ownerData = Object.assign(JSON.parse(JSON.stringify(ownerData)),JSON.parse(JSON.stringify(restaurantData)))
                    resolve(ownerData);
                }
                else {
                    reject({ code:200, message:"You entered wrong Email or Password" });
                }
            }
            else {
                reject({ code:200, message:"You entered wrong Email or Password" });
            }
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    });
};

let ownerResetPassword = (passwordBody) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside reset password service", passwordBody);
            let condition = {
                email: passwordBody.email,
            }
            let ownerData = await models.owner.findOne(
                condition,
            );
            logger.debug(ownerData);
            if(ownerData){
                if (ownerData.password == passwordBody.oldPassword) {
                    await models.owner.updateOne({ _id: ownerData._id }, { $set: { password: passwordBody.newPassword } });
                    resolve("Password Reset Successfully...");
                }
                else {
                    reject({ code: 401, message: "Invalid Old Password!!!" })
                }
            }
            else{
                reject({ code: 401, message: "Invalid Email Id!!!" })
            }
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

const ownerEditProfile = (id, profileBody) => {
    return new Promise(async (resolve, reject) => {
        try {
            logger.trace("inside edit profile service", {id, profileBody});
            if(Object.keys(profileBody).length){
                // await models.restaurant.updateOne({}, { $set: profileBody });
                let originalResProfile = await models.restaurant.findOne (
                    {_id: id},
                    {isOnline: 1, openTime: 1, closeTime: 1}
                );

                let restaurantProfile = await models.restaurant.findOneAndUpdate(
                    {_id: id},
                    { $set: profileBody },
                    {returnOriginal: false},
                );

                logger.debug("OriginalResProfile.......", originalResProfile);
                logger.debug(restaurantProfile);
                resolve({originalResProfile: originalResProfile, restaurantProfile: restaurantProfile});
            }
            else{
                reject({ code:400, message: "No parameters provided!!!" });
            }
        }
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    })
}

//For Uploading Images by Super Admin on Cloud Server (separate from database)
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'server/images/');
	},
	
	filename: (req, file, cb) => {
		cb(null, file.fieldname + path.extname(file.originalname.toLowerCase()));
	}
})
const upload = multer({storage: storage});

const uploadImage = (req, res) => {
	
	return new Promise(async (resolve, reject) => {
		
		upload.single('cover') (req, res, (err) => {
			
			logger.trace("Inside Upload Function", req.file);
		
			if(err) {
				reject('err');
			}
			else
			{
				resolve('success');
			}
		})
	})
	
}

const ownerLogout = (ownerCreds) => {
    logger.trace("inside owner logout", { ownerCreds });
    return new Promise(async (resolve, reject) => {
        try 
        {
            await models.owner.findOneAndUpdate(
                {email: ownerCreds.email},
                {$set: {deviceToken: null, appVersion: null, deviceType: null}}
            );
            resolve('Logged out successfully...');
        }    
        catch (err) {
            logger.fatal(err);
            reject({ code:401, message: err.message });
        }
    });

}

module.exports = {
    addOwner,
    ownerLogin,
    ownerLogout,
    ownerResetPassword,
    ownerEditProfile,
	uploadImage
}