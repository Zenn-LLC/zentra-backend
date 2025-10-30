const mongoose = require('mongoose');
const {Schema} = mongoose;

const verificationSchema = new Schema({
    phoneNo: String,
    OTP: String
});

mongoose.model('verification', verificationSchema);