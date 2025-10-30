require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

const bcrypt = require('bcryptjs');


async function createAccount(req, res) {
    var response = {}
    const {rPhoneNo, rUsername, rPassword, rFirstName, rLastName, rOtherName, rIdName, rAbout} = req.body;
    
    try {
        var userAccount = await Account.findOne({username: rUsername});
        if (userAccount == null) {
            // Hash the password with automatic salt generation
            bcrypt.hash(rPassword, 10, async (err, hash) => {
                if (err) {
                    console.error(err);
                    return;
                }

                // Create a new account
                var newAccount = new Account({
                    phoneNo: rPhoneNo,
                    username: rUsername,
                    password: hash,
                    firstName: rFirstName,
                    lastName: rLastName,
                    otherName: rOtherName,
                    idName: rIdName,
                    about: rAbout,
                    funds: 0.00,
                    rank: 1,
                    profilePic: null,
                    lastAuth: Date.now(),
                    points: 0,
                    graphScore: chart,
                    verified: false,
                    deactivated: false,
                });
                await newAccount.save();
            });


            response.code = 0;
            response.msg = 'Your account has been created!';
            res.send(response);
        } else {
            response.code = 1;
            response.msg = 'Apparently, your username already exists. Please close app and start again.';
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    createAccount: createAccount
}