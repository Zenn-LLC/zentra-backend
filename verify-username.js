require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

async function verify(req, res) {
    var response = {}
    const {rUsername, rPassword, rConfirmPassword} = req.body;
    if (rUsername.length > 2 && rUsername.length < 24) {
        var userAccount = await Account.findOne({username: rUsername});
        if (userAccount == null) {
            if (rPassword.length > 8) {
                if (rPassword == rConfirmPassword) {
                    response.code = 0;
                    response.msg = "Username and password verified!";
                    res.send(response);
                } else {
                    response.code = 3;
                    response.msg = "The passwords do not match.";
                    res.send(response);
                }
            } else {
                response.code = 2;
                response.msg = "Password must have eight characters or more.";
                res.send(response);
            }
        } else {
            response.code = 1;
            response.msg = "This username has been taken.";
            res.send(response);
        }
    } else {
        response.code = 4;
        response.msg = "Invalid username length.";
        res.send(response);
    }
}

module.exports = {
    verify: verify
}