var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sequenceCounter = new Schema({
    restaurantId: {type: String, required: [true, 'restaurant id is required']},
    sequence: {type: Number, default: 0},
    group: {type: String, required: [true, 'Group is required']}
},
{
    timestamps: true
})

module.exports = mongoose.model('sequenceCounter', sequenceCounter);

