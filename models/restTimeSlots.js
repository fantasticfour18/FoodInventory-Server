const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const restTimeSlots = new Schema({
    restaurantId: {type: String, required: [true, 'restaurantId is required']},
    name: {type: String, required: [true, 'name is required']},
    openTime: {type: String, required: [true, 'start time is required']},
    closeTime: {type: String, required: [true, 'end time is required']},
    days: {type: Array, required: [true, 'days is required']},
    holidayDates: {type: Array, default: []},
    isActive: {type: Boolean, default: true},
},
{
    timestamps: true
})

module.exports = mongoose.model('resTimeSlots', restTimeSlots);