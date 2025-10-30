require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

const bcrypt = require('bcryptjs');

async function loginAccount(req, res) {
    var response = {}
    const {rUsername, rPassword} = req.body;

    try {
        const userAccountbyName = await Account.findOne({username: rUsername});
        if (userAccountbyName == null) {
            const userAccountbyNo = await Account.findOne({phoneNo: rUsername});
            if (userAccountbyNo == null) {
                response.code = 1;
                response.msg = 'Password and username mismatch!';
                response.username = null;
                res.send(response);
            } else {
                bcrypt.compare(rPassword, userAccountbyNo.password, (err, result) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    
                    if (result) {
                        response.code = 0;
                        response.msg = 'You are logged in!';
                        response.username = userAccountbyNo.username;
                        res.send(response);
                    } else {
                        response.code = 1;
                        response.msg = 'Password and username mismatch!';
                        response.username = null;
                        res.send(response);
                    }
                });
            }
        } else {
            bcrypt.compare(rPassword, userAccountbyName.password, (err, result) => {
                if (err) {
                    console.error(err);
                    return;
                }
                
                if (result) {
                    response.code = 0;
                    response.msg = 'You are logged in!';
                    response.username = userAccountbyName.username;
                    res.send(response);
                } else {
                    response.code = 1;
                    response.msg = 'Password and username mismatch!';
                    response.username = null;
                    res.send(response);
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    loginAccount: loginAccount
}