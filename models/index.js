var user = require('./user');
var owner = require('./owner');
var restaurant = require('./restaurant');
var topping = require('./topping');
var toppingGroup = require('./toppingGroup');
var option = require('./option');
var category = require('./category');
var item = require('./item');
var order = require('./order');
var sequenceCounter = require('./sequenceCounter');
var admin = require('./admin');
var timeZone = require('./timeZone');
var restTimeSlots = require('./restTimeSlots');
var allergy = require('./allergy');
var allergyGroup = require('./allergyGroup');
var variant = require('./variant');
var variantGroup = require('./variantGroup');
var printer = require('./printers');
var tableOrder = require('./tableOrder');


module.exports = {
    user,
    owner,
    restaurant,
    user,
    variant,
    variantGroup,
    topping,
    toppingGroup,
    option,
    sequenceCounter,
    item,
    category,
    order,
    tableOrder,
    admin,
    timeZone,
    restTimeSlots,
    allergy,
    allergyGroup,
    printer
}