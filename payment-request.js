require('dotenv').config();

const paystack = process.env.PAYSTACK_KEY;
const mongoURI = process.env.DATABASE_URL;

var username;
var money;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

async function paymentReq(req, res) {
    const paymentRequest = {
      email: req.body.email,
      amount: req.body.amount * 100, // Amount in kobo (smallest unit of currency).
    };

    money = req.body.amount;
    username = req.body.username;
  
    try {
      const response = await paystack.transaction.initialize(paymentRequest);
      res.send(response.data.authorization_url);


    } catch (error) {
      res.status(500).send("Error!");
    }
}

async function paymentCallback(req, res) {
    const reference = req.query.reference;

    try {
      const verifyResponse = await paystack.transaction.verify(reference);
      if (verifyResponse.data.status === 'success') {
        // Payment was successful. You can update your database or provide access to paid content.
        res.send('Payment successful');
        console.log("It worked!");
      } else {
        res.send('Payment failed');
        console.log("Payment failed");
      }
    } catch (error) {
      res.status(500).send({ error: error.message });
      console.log("Could not verify payment");
    }
}

async function paymentWebhook(req, res) {
    if (req.body.event = 'charge.success') {
      var userAccount = await Account.findOne({username: username});
      if (userAccount.username == username) {
          var newMoney = parseInt(money, 10) + parseInt(userAccount.funds, 10);
          await Account.findOneAndUpdate({username: username}, {funds: newMoney}, {new: true});
          //const events = req.body;
          console.log(req.body);
      } else {
        console.log("Couldn't find it.");
      }
      
      res.status(200).send('Webhook received and processed');
    }
}

module.exports = {
    paymentReq: paymentReq,
    paymentCallback: paymentCallback,
    paymentWebhook: paymentWebhook
}
  