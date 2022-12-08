const logger = require('../../config/logger');
const posMenuService = require('../service/posMenuServices');
const fs = require("fs");

// For POS Menus
const getPosMenus = (req, res) => {
    logger.trace("inside get POS menus controller");
    
    posMenuService.getPosMenus(req.payLoad.restaurantId).then(data=>{
        const menus = data;
        res.status(200).json({"success":true, "data":data});
    })
    .catch(err=>{
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

const addPosMenus = (req, res) => {
    const menus = req.body.data;
    logger.info("inside add POS menus controller--->", menus);

    posMenuService.addPosMenus(req.payLoad.restaurantId, menus).then(data => {
        return res.status(200).json({"success":true, "message":data.msg})
    })
    .catch(err => {
        logger.fatal(err);
        return res.status(err.code?err.code:404).json({"success":false,"message":err.message});
    });
}

module.exports = {
    getPosMenus,
    addPosMenus
}