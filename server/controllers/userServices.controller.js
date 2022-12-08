const logger = require('../../config/logger');
const userService = require('../service/userServices');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var uuid = require('uuid');
const { sendReservationEmail } = require('../helpers/reservationMailer');

const twilioConfig = require('../../config/twilioConfig');
const client  = require("twilio")(twilioConfig.accountSID, twilioConfig.authToken);

// AWS SDK Config
const AWS = require('aws-sdk');
AWS.config.loadFromPath('./config/aws-ses/aws-ses-config.json');

const sendOTP = (req, res) => {
  let userPhone = req.body.contact;

  logger.info('inside send OTP controller--->', userPhone);

  client.verify.services(twilioConfig.serviceSID).verifications.create({
    to: userPhone,
    channel: 'sms'
  })
  .then((data) => {
    logger.info('On Fulfilled', data);
    res.status(200).json({ success: true, message: "OTP send successfuly to your mobile" });
  })
  .catch(err => {
    logger.info('On Reject ', err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  })

  /* userService.updateOTP(userPhone, Math.floor(1000 + Math.random() * 9000)).then(data => {
    
    const messageBody = {
      Subject: "AX-SINGHS",
      Message: "Vielen Dank für Ihren Besuch in Singh's Indian Restaurant. Ihr OTP für die Kontoregistrierung ist " 
                + data.otp + ". Bitte nicht teilen, da vertraulich.",
      PhoneNumber: userPhone
    }

    const SNSPromise = new AWS.SNS().publish(messageBody).promise();
    SNSPromise.then((data) => {
      logger.info('On Fulfilled--->', data)
      return res.status(200).json({success: true, message: "OTP send to your mobile."});
    })
    .catch((err) => {
      logger.info('On Reject ', err);
      return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    })
  })
  .catch(err => {
    logger.trace(err.message);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  }) */
}

const verifyOTP = (req, res) => {
  let userPhone = req.body.contact;
  let otp = req.body.otp;

  client.verify.services(twilioConfig.serviceSID).verificationChecks.create({
    to: userPhone,
    code: otp
  })
  .then((data) => {

    logger.info(data);

    // OTP Verified
    if(data.status == 'approved') 
    {
      // Check if user exists
      userService.checkUser(userPhone).then(userResp => {

        let userData = JSON.parse(JSON.stringify(userResp));
        if(userData.isActive)
        {
          let payload = {
            "email" : userData.email,
            "userId": userData._id,
            "userType": "customer"
          }
          userData["token"] =  jwt.sign(payload,'my_secret_key',{ expiresIn: "1y" });
        }
        delete userData._id;

        return res.status(200).json({success: true, userData: userData});
      })
      .catch(err => {
        logger.trace(err.message);
        return res.status(200).json({"success":false,"message":err.message});
      })
    }
    else {
      return res.status(200).json({success: false, message: "Invalid OTP"});
    }
  })
  .catch(err => {
    logger.info('On Reject ', err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  })

  /* userService.verifyOTP(userPhone, otp).then(data => {
    if(data.isVerified) 
    {
      let userData = JSON.parse(JSON.stringify(data.user));
      if(userData.isActive)
      {
        let payload = {
          "email" : userData.email,
          "userId": userData._id,
          "userType": "customer"
        }
        userData["token"] =  jwt.sign(payload,'my_secret_key',{ expiresIn: 60*60*24*30 });
      }
      delete userData._id;

      return res.status(200).json({success: true, message: data.message, userData: userData});
    }
    else {
      return res.status(200).json({success: false, message: data.message});
    }
  })
  .catch(err => {
    logger.trace(err.message);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  }) */
}

/* const userLogin = (req,res,next)=>{
  logger.trace("inside userLogin controller");
  var userData = req.body;
  userService.userLogin(userData, res).then(data=>{
    logger.debug("data found",data);
    let payload = {
      "email" : data.email,
      "userId":data._id,
    }
    data.token =  jwt.sign(payload,'my_secret_key',{ expiresIn: 60*60*24*30 });
    delete data.password;
    res.json({"success":true, "data":data});
  }).catch(err=>{
	  logger.trace(err.message);
    return res.status(200).json({"success":false,"message":err.message});
  });
} */

const registerUser = (req,res,next)=>{
  logger.trace("inside userLogin controller");
  var userData = req.body;
  userService.registerUser(userData, res).then(data=>{
    logger.debug("data found",data);
    data = JSON.parse(JSON.stringify(data));

    let payload = {
      "email" : data.email,
      "userId": data._id,
      "userType": "customer"
    }
    data["token"] =  jwt.sign(payload,'my_secret_key',{ expiresIn: "1y" });
    delete data._id
    res.json({"success":true, "data":data});
  }).catch(err=>{
	  logger.trace(err.message);
    return res.status(200).json({"success":false,"message":err.message});
  });
}

const addUser = async (req,res,next)=>{
  logger.trace("inside addUser controller");
  let userData = req.body;
  const salt = await bcrypt.genSaltSync(10);
  const hashPassword = await bcrypt.hashSync(userData.password, salt);
  userData.password = hashPassword;
  logger.debug(userData);
  userService.addUser(userData).then(data=>{
    let payload = {
      "email" : data.email,
      "userId":data._id,
    }
	logger.trace('After Adding');
    data.token =  jwt.sign(payload,'my_secret_key',{ expiresIn: "1y" });
    delete data.password;
    return res.json({"success":true,"data":data});
  }).catch(err=>{
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
	//return res.status(200).json({"success":false,"message":err.message});
  });
}

const validatePassCode = (req,res,next)=>{
  logger.trace("inside validate passcode controller");
  userService.validatePassCode(req.query.resPassCode, req.query.passcode, req.query.apiKey).then(data=>{
      res.status(200).json({"success":true, "data":data});
  }).catch(err=>{
      logger.fatal(err);
      return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  });
}

const bookReservation = (req, res) => {
  let userData = req.body;
  let restEmail = req.body.restEmail;
  
  delete userData.restEmail;

  sendReservationEmail(userData, restEmail);
  res.status(200).json({success: true, message: "Reservation booked successfully..."});
}

const getHomeRestaurants = (req, res) => {

  userService.getHomeRestaurants(req.body.placeId, req.body.apiKey).then(data => {
    let categories = data.categories;
    delete data.categories;

    let rests = [];
    data.restaurants.forEach(rest => {
      let restData = JSON.parse(JSON.stringify(rest));
      restData["categories"] = JSON.parse(JSON.stringify(categories.filter(cat => cat.restaurantId == rest._id)));
      rests.push(restData);
    })
    data.restaurants = rests;

    res.status(200).json({success: true, data: data});
  })
  .catch(err => {
    logger.fatal(err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  })
}

const getFilteredRests = (req, res) => {
  let filter = req.body.filters, restIds = req.body.restIds;  

  // Filter Results based on post data
  if(restIds.length) {
    filter["_id"] = {
      $in: restIds
    }
  }

  if(filter.discount) 
  {
    filter["$or"] = [
      {collectionDiscount: {$gt: 0}},
      {deliveryDiscount: {$gt: 0}}
    ]

    delete filter["discount"];
  }

  userService.getFilteredRests(filter, restIds).then(data => {
    res.status(200).json({success: true, restaurants: data});
  })
  .catch(err => {
    logger.fatal(err);
    return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
  })
}


module.exports = {
  sendOTP,
  verifyOTP,
  /* userLogin, */
  registerUser,
  addUser,
  validatePassCode,
  bookReservation,
  getHomeRestaurants,
  getFilteredRests
};