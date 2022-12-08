var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tableOrder = new Schema ({
    tableNumber: {type: Number, required: [true, 'table number is required']},
    orderNumber:{ type: String, required: [true,'order number is required!!!'], index: { unique: true, sparse: true }},
    orderType: {type: String, default: "Table QR"},
    repeatOrder: {type: Boolean, default: false},
    itemDetails:{ type:Array, required:[true,'item details is required!!!']},
	orderDateTime: {type: String, required: [true, 'Order Date and Time is required']},
    tip: {type: String, default: '0'},
    paymentMode:{ type:String, required: [true,'payment mode is required!!!']},
    subTotal:{ type:Number, required: [true,'subTotal is required!!!']},
    discount:{ type:Number, default:0},
    totalAmount:{ type:Number, required: [true,'total ammount is required!!!']},
    createdOn:{ type: Date, required: [true,'createdOn is required!!!']},
    orderStatus:{ type:String, enum:["PENDING", "PAYING", "ACCEPTED", "COMPLETED","CANCELLED","FAILED"], default:"PENDING"},
    note:{ type:String, default:null},
    isDeleted:{type: Boolean, default:false},
    isPaid:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('tableOrder', tableOrder);