var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const allergyGroup = new Schema ({
    name:{ type: String, required: [true,'name is required!!!']},
    allergies:[{ type: Schema.Types.ObjectId, ref:'allergy'}],
    allergyIds:{ type: String, required: [true,'allergy Ids is required!!!']},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('allergyGroup', allergyGroup);