var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const toppingGroup = new Schema ({
    name:{ type: String, required: [true,'name is required!!!']},
    toppings:[{ type: Schema.Types.ObjectId, ref:'topping'}],
    toppingIds:{ type: String, required: [true,'toppingIds is required!!!']},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('toppingGroup', toppingGroup);