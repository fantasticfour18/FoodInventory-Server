var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const item = new Schema ({
    name:{ type: String, required: [true,'name is required!!!']},
    menuType: {type: String, required: [true, 'menu type is required!!!'], default: 'online'},
    category:{ type: Schema.Types.ObjectId, ref:'category',required: true},
    /* toppingGroup:{ type: Schema.Types.ObjectId, ref:'toppingGroup',default:null}, */
    allergyGroup:{ type: Schema.Types.ObjectId, ref:'allergyGroup', default:null},
    /* variantGroup:{type: Schema.Types.ObjectId, ref: 'variantGroup', default:null}, */
    price:{ type: Number},
    options:{type: Array, default:null},
    variants:{type: Array, default:null},
    discount: {type:Number, default:0},
	description: {type: String, default: null},
    excludeDiscount: {type: Boolean, default: false},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null},
    isActive: {type: Boolean, default: true},
    position: {type: Number},
    imageName: {type: String, default: ''},
},
{
    timestamps: true
});

module.exports = mongoose.model('item', item);
