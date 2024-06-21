const mongoose = require("mongoose");
require('dotenv').config()

const userSchema = new mongoose.Schema({

    name:{ type: String, required: true },
    email:{ type: String, required: true, unique: true },
    mobile:{ type: Number, unique: true },
    password:{ type: String, required: true },
    confirmPassword:{ type: String },
    status: { type:Boolean, default: true },
    profilePhoto: { type: Object },
    address: [{
        name: { type: String },
        address: {type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        phone: { type: Number }
    }]
});


const Users = mongoose.model('Users',userSchema);

module.exports = Users