const Joi = require('joi');

module.exports = {
  login: {
    body: {
        email: Joi.string().email().required(),
        password: Joi.string().required().max(128),
    },
  },
  resetPassword: {
    body: {
        email: Joi.string().email().required(),
        newPassword: Joi.string().required().max(128),
        oldPassword: Joi.string().required().max(128),
    },
  },
  editProfile: {
    body: {
        restaurantName: Joi.string().max(128),
        location:Joi.string().max(128),
        shortDescription:Joi.string().max(128),
        image:Joi.string().max(128),
    },
  },
  
}