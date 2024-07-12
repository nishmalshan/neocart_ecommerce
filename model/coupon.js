const mongoose = require('mongoose');
require('dotenv').config()




const couponSchema = new mongoose.Schema({
    couponName: { type: String },
    coupunCode: { type: String },
    discountAmount: { type: Number},
    startDate: { type: Date },
    endDate: { type: Date }
})


const coupons = mongoose.model('coupon',couponSchema)

module.exports = coupons