const logger = require('../../config/logger');
const models = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const isUserExist = (data)=>{
  logger.debug("inside is user exist");
  return new Promise(async (resolve,reject)=>{
    let condition = {
      email:data.email,
    }
    let userData = await models.user.findOne({attributes:['email'],where:condition});
    if(userData){
      resolve(true);
    }
    else{
      resolve(false);
    }
  });
}

/* const userLogin = (userCreds, res)=>{
  logger.trace("inside user login",{userCreds});
  return new Promise(async (resolve,reject)=>{
    try{
      let condition = {
        email:userCreds.email,
      }
      let userData = await models.user.findOne(condition,{_id:0,__v:0});
	  logger.trace("Data");
      logger.debug(userData);
      userData = JSON.parse(JSON.stringify(userData));
      if(userData){
        // if(userData.isActive){
        if(userCreds.loginMode === 'social')
        {
          logger.trace("Social Found")
          resolve(userData)	
        }
			
        else if(userData && bcrypt.compareSync(userCreds.password, userData.password)){
          delete userData.password;
          resolve(userData);
        }
        else{
          reject(new Error("Invalid Password"));
        }
      }
      else{
		 if(userCreds.loginMode === 'social')
		 { 
			logger.trace("inside addUser controller");
			  let userData = userCreds;
			  const salt = await bcrypt.genSaltSync(10);
			  const hashPassword = await bcrypt.hashSync(userData.password, salt);
			  userData.password = hashPassword;
			  logger.debug(userData);
			  addUser(userData).then(data=>{
				let payload = {
				  "email" : data.email,
				  "userId":data._id,
				}
			
				data.token =  jwt.sign(payload,'my_secret_key',{ expiresIn: 60*60*24*30 });
				delete data.password;
				return res.json({"success":true,"data":data});
			  }).catch(err=>{
				  logger.trace(err);
				return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
			  });
		 }
			
        else {
			reject(new Error("Invalid Email ID"));
		} 
			
      }
    }
    catch(err){
      logger.fatal(err);
    }
  });
}; */

const updateOTP = (userPhone, otp) => {
  return new Promise(async (resolve, reject) => {
    try
    {
      let phone = await models.user.findOne({contact: userPhone});
      if(phone) {
        await models.user.updateOne({contact: userPhone}, {$set: {otp: otp}});
      }
      else {
        await models.user.insertMany([{contact: userPhone, otp: otp}]);
      }

      resolve({message: "otp updated successfully", otp: otp});
    }
    catch(err)
    {
      logger.fatal(err);
      reject({ code:401, message: err.message });
    }
  })
}

const checkUser = (userPhone) => {
  return new Promise(async (resolve, reject) => {
    try
    {
      let user = await models.user.findOne({contact: userPhone}, {__v: 0, password: 0, otp: 0});

      if(user) {
        resolve(user);
      }
      else 
      {
        await models.user.insertMany([{contact: userPhone}]);
        resolve({isActive: false});
      }
    }
    catch(err)
    {
      logger.fatal(err);
      reject({ code:401, message: err.message });
    }
  })
}

const verifyOTP = (userPhone, otp) => {
  return new Promise(async (resolve, reject) => {
    try
    {
      let user = await models.user.findOne({contact: userPhone, otp: otp}, {__v: 0, password: 0, otp: 0});

      if(user) {
        await models.user.updateOne({contact: userPhone}, {$set: {otp: -1}});
        resolve({isVerified: true, message: "OTP verification successful", user: user});
      }
      else {
        resolve({isVerified: false, message: "Invalid OTP"});
      }
    }
    catch(err)
    {
      logger.fatal(err);
      reject({ code:401, message: err.message });
    }
  })
}

const registerUser = (userCreds, res) => {
  return new Promise(async (resolve, reject) => {
    try
    {
      const user = await models.user.findOne({email: userCreds.email});
      if(!user) 
      {
        userCreds.isActive = true;
        const userData = await models.user.findOneAndUpdate(
          {contact: userCreds.contact}, userCreds,
          {projection: {__v: 0, password: 0, otp: 0}, returnOriginal: false});

        resolve(userData);
      }
      else {
        reject({message: "Email already exists. Please choose different email."});
      }
    }
    catch(err)
    {
      logger.fatal(err);
      if(err.code == 11000)
      {
        let key = Object.keys(err.keyValue);
        key = err.keyValue[key[0]];
        return reject(new Error({ code:422, message: `${key} already exists` }));
      }
      reject({ code:401, message: err.message }); 
    }
  })
}

const addUser = (userData)=>{
  return new Promise(async (resolve,reject)=>{
    try{
	  userData = await models.user.create(
			userData
		  );
		  userData = JSON.parse(JSON.stringify(userData));
		  logger.debug("added successfully",{userData});
		  resolve(userData);		  
    }
    catch(err){
      logger.fatal(err);
      if(err.code == 11000){
        let key = Object.keys(err.keyValue);
        key = err.keyValue[key[0]];
        return reject(new Error({ code:422, message: `${key} already exists` }));
      }
      reject({ code:401, message: err.message });   
    }
  });
};

const validatePassCode = (resPasscode, placeId_or_passcode, apiKey) =>{
  logger.debug("inside validate passcode",placeId_or_passcode, resPasscode);
  return new Promise(async (resolve,reject)=>{
    try {

    // For GERMAN
    let googleURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?destinations=place_id:' 
                    + placeId_or_passcode + '&origins=place_id:' + resPasscode + '&mode=driving&key=' + apiKey;

		axios.get(googleURL).then((response) => 
			{
				logger.trace(response.data);
				resolve(response.data);
			})
			.catch((err) => {
				logger.trace(err);
				reject(err);
			})
    }
    catch (err) {
      logger.fatal(err);
      reject({ code:401, message: err.message });
    }
  })
}

const getHomeRestaurants = (userPlaceId, apiKey) => {
  return new Promise(async (resolve, reject) => {
		try
		{
      let restDests = [];
			let restaurants = await models.restaurant.find({showOnMultiple: true}, {ownerId: 0, tableDetails: 0, __v: 0});
      let categories = await models.category.find({}, {_id: 0, name: 1, restaurantId: 1});

      restaurants.forEach(rest => {
        if(rest.passcode.length) {
          restDests.push("place_id:" + rest.passcode[0]);
        }
      });

      // Get Distances of each restaurants from User's location
      let googleURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?destinations=' 
        + restDests.join('|') + '&origins=place_id:' + userPlaceId + '&mode=driving&key=' + apiKey;

      axios.get(googleURL).then((response) => 
      {
        logger.trace(response.data);
        resolve({restaurants: restaurants, distances: response.data, categories: categories});
      })
      .catch((err) => {
        logger.trace(err);
        reject(err);
      })
		}
		catch(err)
		{
			logger.fatal(err)
      reject({code: 401, msg: err});
		}
	})
}

const getFilteredRests = (filters, restIds) => {
  return new Promise(async (resolve, reject) => {
    try
    {
      let restaurants = await models.restaurant.find(filters, {ownerId: 0, tableDetails: 0});
      logger.info(restaurants);
      resolve(restaurants);
    }
    catch(err)
    {
      logger.fatal(err)
      reject({code: 401, msg: err});
    }
  })
}


module.exports = {
  updateOTP,
  verifyOTP,
  /* userLogin, */
  checkUser,
  registerUser,
  addUser,
  validatePassCode,
  getHomeRestaurants,
  getFilteredRests
};