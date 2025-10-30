require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

async function retrieveMoneyTransactions(req, res) {
    const {rUsername, rPassword} = req.body;
    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const transactions = userAccount.moneyTransact;
                    if (transactions != null) {
                        res.send({transactions: transactions});
                    } else {
                        res.send({transactions: []});
                    }
                } else {
                    res.send('Error dey dawg');
                }
            });
        } else {
            res.send('No account was found.');
        }
    } catch (error) {
        console.log(error);
    }
}

async function retrieveGameTransactions(req, res) {
    const {rUsername, rPassword} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const transactions = userAccount.gameTransact;
                    if (transactions != null) {
                        res.send({transactions: transactions});
                    } else {
                        res.send({transactions: []});
                    }
                } else {
                    res.send('Error dey dawg');
                }
            });
        } else {
            res.send('No account was found.');
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    retrieveMoneyTransactions: retrieveMoneyTransactions,
    retrieveGameTransactions: retrieveGameTransactions
};