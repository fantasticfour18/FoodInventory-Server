var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const printer = new Schema ({
    restaurantId: { type: Schema.Types.ObjectId, required: true, index: {unique: true} },
    printers: { type: Array }
},
{
    timestamps: true
});

module.exports = mongoose.model('printer', printer);