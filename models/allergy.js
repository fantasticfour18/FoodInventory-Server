var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const allergy = new Schema ({
    name:{ type: String, required: [true,'name is required!!']},
    description:{ type: String, default:null},
    createdOn:{ type: Date, default: new Date},
    isDeleted:{type: Boolean, default:false},
    restaurantId:{type: String, default:null}
},
{
    timestamps: true
});

module.exports = mongoose.model('allergy', allergy);