const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const admin = new Schema({
    email: {type: String, required: [true, 'email is required!!!'], index: {unique: true, sparse: true}},
    password: {type: String, required: [true,'password is required!!!']}
}, 
{
    timestamps: true
});

module.exports = mongoose.model('admin', admin);