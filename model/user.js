const mongoose = require("mongoose");
require('dotenv').config()

const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    mobile:{
        type: Number,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    confirmPassword:{
        type: String
    },
    status: {
        type:Boolean,
        default: true
    }
});


const Users = mongoose.model('Users',userSchema);

module.exports = Users