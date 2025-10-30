require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

async function accountSettings(req, res) {
    var response = {};
    const {rUsername, rPassword, rFirstName, rLastName, rOtherName, rID, rAbout, rPic} = req.body;

    try {
        if (rFirstName.length > 2 && rFirstName.length < 24) {
            if (rLastName.length > 2 && rLastName.length < 24) {
                if (rOtherName.length != 0) {
                    if (rID.length > 2 && rID.length < 24) {
                        const userAccount = await Account.findOne({username: rUsername});
                        if (userAccount) {
                            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                                if (err) {
                                    console.log(err);
                                    return;
                                }

                                if (result) {
                                    if (rPic != "null") {
                                        let base64String = rPic;
                                        let byteArray = Buffer.from(base64String, 'base64');
                                
                                        await Account.findOneAndUpdate(
                                            {username: rUsername},
                                            {
                                                firstName: rFirstName,
                                                lastName: rLastName,
                                                otherName: rOtherName,
                                                idName: rID,
                                                about: rAbout,
                                                profilePic: byteArray
                                            },
                                            {new: true}
                                        );
                                    } else {
                                        await Account.findOneAndUpdate(
                                            {username: rUsername},
                                            {
                                                firstName: rFirstName,
                                                lastName: rLastName,
                                                otherName: rOtherName,
                                                about: rAbout,
                                                idName: rID
                                            },
                                            {new: true}
                                        );
                                    }
                            
                                    response.code = 0;
                                    response.msg = "Successfully updated!";
                                    res.send(response);
                                } else {
                                    response.code = 1;
                                    response.msg = "Account not found!";
                                    res.send(response);
                                }
                            });
                        } else {
                            response.code = 1;
                            response.msg = "Account not found!";
                            res.send(response);
                        }
                    } else {
                        response.code = 1;
                        response.msg = "Identity name has invalid character length.";
                        res.send(response);
                    }
                } else {
                    response.code = 2;
                    response.msg = "Other name has invalid character length.";
                    res.send(response);
                }
            } else {
                response.code = 2;
                response.msg = "Last name has invalid character length.";
                res.send(response);
            }
        } else {
            response.code = 3;
            response.msg = "First name has invalid character length.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    accountSettings: accountSettings
}