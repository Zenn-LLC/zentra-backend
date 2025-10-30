require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;
const accountSid = process.env.TWILIO_KEY_SID;
const authToken = process.env.TWILIO_KEY_TOKEN;

const client = require('twilio')(accountSid, authToken);
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
require('./model/Verification.js');
const Verification = mongoose.model('verification');
const Account = mongoose.model('accounts');

async function generate(req, res) {
    var response = {}
    var otp = Math.ceil(Math.random() * 1000000);

    var userAccount = await Account.findOne({phoneNo: req.body.rPhoneNumber});

    if (userAccount == null) {
        await client.messages
            .create({
                body: 'Your OTP code is ' + otp.toString(),
                to: req.body.rPhoneNumber, // Text your number
                from: '+12312626744', // From a valid Twilio number
            })
            .then(async (message) => {

                var userOTP = await Verification.findOne({phoneNo: req.body.rPhoneNumber});
                if (userOTP != null) {
                    await Verification.findOneAndDelete({phoneNo: req.body.rPhoneNumber})
                }

                var newOTP = new Verification({
                    phoneNo: req.body.rPhoneNumber,
                    OTP: otp.toString()
                });
                await newOTP.save();
                response.code = 0;
                response.msg = "Your OTP has been sent!";
                res.send(response);
            })
            .catch(async (err) => {
                response.code = 1;
                response.msg = "There was an error in sending an OTP.";
                res.send(response);
            })
    } else {
        response.code = 2;
        response.msg = "This phone number has been used to create an account.";
        res.send(response);
    }
}

async function verify(req, res) {
    var response = {};
    var userOTP = await Verification.findOne({phoneNo: req.body.rPhoneNumber});
    if (userOTP.OTP == req.body.rOTP) {
        response.code = 0;
        response.msg = "Your phone number has been verified!";
        res.send(response);
        await Verification.findOneAndDelete({phoneNo: req.body.rPhoneNumber});
    } else {
        response.code = 1;
        response.msg = "The OTP is incorrect.";
        res.send(response);
    }
}

module.exports = {
    generate: generate,
    verify: verify
}
