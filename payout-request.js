require('dotenv').config();

const paystack = process.env.PAYSTACK_KEY;
const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

async function payoutReq(req, res) {
    const payoutRequest = {
        source: 'balance',
        reason: 'transfer of funds',
        amount: req.body.amount * 100, // Amount in kobo (smallest unit of currency).
    };
  
    try {
        const response = await paystack.transfer.create(payoutRequest);
        res.send(response);
    } catch (error) {
        res.status(500).send("Error!");
    }
}

module.exports = {
    payoutReq: payoutReq
}
  