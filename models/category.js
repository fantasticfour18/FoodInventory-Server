var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const category = new Schema ({
    name:{ type: String, required: [true,'name is required!!!'] },
	description: {type: String, default: null},
    discount: {type:Number, default:0},
    excludeDiscount: {type: Boolean, default: false},
    position: {type: Number},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null},
    isActive: {type: Boolean, default: true},
    imageName: {type: String, default: ''}
},{
    timestamps: true
});

module.exports = mongoose.model('category', category);