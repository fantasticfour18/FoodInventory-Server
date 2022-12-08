var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const order = new Schema ({
    orderNumber:{ type: String, required: [true,'order number is required!!!'], index: { unique: true, sparse: true }},
    userDetails:{ type:JSON, required: [true,'userId is required!!!']},
    itemDetails:{ type:Array, required:[true,'item details is required!!!']},
    deliveryType:{ type:String, enum:["DELIVERY","PICKUP"], required: [true,'delivery type is required!!!']},
    deliveryAddress:{ type:String },
    /* deliveryDatetime:{ type:Date, required: [true,'delivery date is required!!!']}, */
	orderDateTime: {type: String, required: [true, 'Order Date and Time is required']},
    tip: {type: String, default: '0'},
    paymentMode:{ type:String, required: [true,'payment mode is required!!!']},
    subTotal:{ type:Number, required: [true,'subTotal is required!!!']},
    deliveryCharge:{ type:Number, default: 0},
    discount:{ type:Number, default:0},
    orderTime: {type: String},
    totalAmount:{ type:Number, required: [true,'total ammount is required!!!']},
    createdOn:{ type: Date, required: [true,'createdOn is required!!!']},
    orderStatus:{ type:String, enum:["PENDING","ACCEPTED","DENIED","COMPLETED","CANCELLED","FAILED"], default:"PENDING"},
    note:{ type:String, default:null},
    isDeleted:{type: Boolean, default:false},
    isPaid:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('order', order);