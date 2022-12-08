var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variantGroup = new Schema ({
    name:{ type: String, required: [true,'name is required!!!'], index: { unique: true, sparse: true }},
    variants:[{ type: Schema.Types.ObjectId, ref:'variant'}],
    variantIds:{ type: String, required: [true,'variantIds is required!!!'], index: { unique: true, sparse: true }},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('variantGroup', variantGroup);