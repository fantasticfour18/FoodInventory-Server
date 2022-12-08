const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const timeZone = new Schema({
    restaurantId: {type: String, required: [true, 'restaurantId is required']},
    name: {type: String, required: [true, 'name is required']},
    items: {type: Array, required: [true, 'items is required']},
    startTime: {type: String, required: [true, 'start time is required']},
    endTime: {type: String, required: [true, 'end time is required']},
    days: {type: Array, required: [true, 'days is required']},
    isActive: {type: Boolean, default: true},
    zoneGroup: {type: String, required: [true, 'zone Group is Required']}
},
{
    timestamps: true
})

module.exports = mongoose.model('timeZone', timeZone);