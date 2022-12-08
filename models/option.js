var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const option = new Schema ({
    name:{ type: String, required: [true,'name is required!!!'], index:{ unique: true }},
    toppingGroup:{type: Schema.Types.ObjectId, ref:'toppingGroup', default:null},
    minToppings:{type: Number, default:0},
    maxToppings:{type: Number, default:0},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('option', option);