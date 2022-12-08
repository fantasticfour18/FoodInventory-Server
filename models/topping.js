var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const topping = new Schema ({
    name:{ type: String, required: [true,'name is required!!']},
    price:{ type: Number, required: [true,'price is required!!!']},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('topping', topping);