var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variant = new Schema ({
    name:{ type: String, required: [true,'name is required!!'], index: { unique: true }},
    price:{ type: Number, default: 0},
    variantGroup:{type: Schema.Types.ObjectId, ref:'variantGroup', default:null},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('variant', variant);