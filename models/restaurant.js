var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const restaurant = new Schema ({
    ownerId: {type: Schema.Types.ObjectId, ref:'owner'},
    restaurantName:{ type: String, required: [true,'restaurantName is required!!!']},
    location:{ type: String, required: [true,'location is required!!!']},
    shortDescription:{ type: String, default:null },
    image:{ type: String, default:null},
    imageIcon:{ type: String, default:null},
    createdOn:{ type: Date, default: new Date},
    isOnline:{ type: Boolean, default: true},
    review:{ type:Number, default:4},
    deliveryDiscount:{ type:Number, default:0},
    collectionDiscount:{ type:Number, default:0},
    phoneNumber:{ type: String, required: [true,'phoneNumber is required!!!']},
	openTime:{ type:String, default:null}, //required:[true,'openTime is required!!!']},
    closeTime:{ type: String, default:null}, //required:[true,'closeTime is required!!!']},
    openDay:{ type: String, default:null}, //required: [true,'openDay is required!!!']},
    closeDay:{ type: String, default:null }, //required: [true,'closeDay is required!!!']},
    passcode:{type: Array, default:[]},
    acceptedPostcodes: {type: Array, default: []},
    minimumOrder:{type: Number, default:0},
    deliveryRadius:{ type: Number, default:0},
    wifiPrinterIP:{ type: String, default:null},
    wifiPrinterPort:{ type: String, default:0},
	websiteURL: { type: String, default:null },
    tableWebsiteURL: { type: String, default:null },
    vatNumber: {type: String, default:null},
    restEmail: {type: String, defult:null},
    deliveryTime: {type: String, default:null},
    collectionTime: {type: String, default:null},
    deliveryCharges: {type:Number, default:0},
    distanceDetails: {type:Array, defualt: []},
    autoAccept: {type: Boolean, default: true},
    autoPrint: {type: Boolean, default: true},
    paperSize: {type: String, default: '80 mm'},
    printCopies: {type: Number, default: 1},
    allowOnlineDelivery: {type: Boolean, default: true},
    allowOnlinePickup: {type: Boolean, default: true},
    isReservationActive: {type: Boolean, default: true},
    showTableMenu: {type: Boolean, default: true},
    showOnMultiple: {type: Boolean, default: false},
    tableDetails: {type: Array, default: []},
    printerPortType: {type: String, default: "LAN"},
    usbPrinterName: {type: String, default: null}
},
{
    timestamps: true
});

module.exports = mongoose.model('restaurant', restaurant);

// await models.owner.create({
    // password:"Root@123@",
    // email:"kashmiritandoor@gmail.com",
    // restaurantName:"Kashmiri Tandoor",
    // location:"USA-washington DC",
    // shortDescription:"Best Indian Taste",
    // image:'image path'
// });