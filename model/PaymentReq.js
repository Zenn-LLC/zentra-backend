const mongoose = require('mongoose');
const {Schema} = mongoose;

const paymentReqSchema = new Schema({
    phoneNo: String,
    newFunds: Number
});

mongoose.model('paymentReqs', paymentReqSchema);