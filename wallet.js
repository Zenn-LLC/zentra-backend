require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');
require('./model/Wallet.js');
const Wallet = mongoose.model('wallets');


async function createWallet(req, res) {
    var response = {}
    const {rUsername, rPassword, rWalletName, rCurrency, rWalletType} = req.body;
    
    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    // Create a new wallet
                    const f4s = await require('./generate-string.js').generateRandomString(4);
                    const s4s = await require('./generate-string.js').generateRandomString(4);
                    const t4s = await require('./generate-string.js').generateRandomString(5);
                    
                    const f4ss = await require('./generate-string.js').generateRandomString(4);
                    const s4ss = await require('./generate-string.js').generateRandomString(4);
                    const t4ss = await require('./generate-string.js').generateRandomString(5);

                    const publicKey = "publ-" + f4s + "-" + s4s + "-" + t4s + "-xyz";
                    const privateKey = "priv-" + f4ss + "-" + s4ss + "-" + t4ss + "-xyz";

                    const color = await require('./generate-string.js').generateHexString(6);

                    var newWallet = new Wallet({
                        name: rWalletName,
                        publicKey: publicKey,
                        privateKey: privateKey,
                        balance: 0,
                        creator: rUsername,
                        currentUser: rUsername,
                        type: rWalletType,
                        color: color,
                        transactions: [],
                        walletDescription: "",
                        currency: rCurrency
                    });
                    await newWallet.save();

                    
                    await Account.findOneAndUpdate(
                        {username: rUsername},
                        {
                            $push: {wallets: publicKey},
                        },
                        {new: true}
                    );
                    
                    response.code = 0;
                    response.msg = "Your wallet was successfully created.";
                    res.send(response);
                } else {
                    response.code = 1;
                    response.msg = "Failed to create wallet. Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 3;
            response.msg = "This account doesn't exist somehow.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

async function singleWallet(req, res) {
    var response = {}
    const {rUsername, rPassword, rPrivateKey} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const userWallet = await Wallet.findOne({privateKey: rPrivateKey});
                    if (userWallet != null) {
                        if (userAccount.wallets.indexOf(userWallet.publicKey) < 0) {
                            response = {
                                code: 0,
                                msg: "This wallet has been added to your account.",
                                wallet: {
                                    name: userWallet.name,
                                    balance: userWallet.balance,
                                    creator: userWallet.creator,
                                    currentUser: userWallet.currentUser,
                                    type: userWallet.type,
                                    color: userWallet.color,
                                    transactions: userWallet.transactions,
                                    walletDescription: userWallet.walletDescription,
                                    currency: userWallet.currency,
                                    publicKey: userWallet.publicKey
                                }
                            }

                            await Account.findOneAndUpdate(
                                {username: rUsername},
                                {
                                    $push: {wallets: userWallet.publicKey},
                                },
                                {new: true}
                            );
                        } else {
                            response = {
                                code: 1,
                                msg: "This wallet already exists on this account.",
                                wallet: {}
                            }
                        }
                    } else {
                        response = {
                            code: 1,
                            msg: "This key isn\'t associated with a wallet.",
                            wallet: {}
                        }
                    }

                    res.send(response);
                } else {
                    response.code = 2;
                    response.msg = "Failed to find wallet. Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 3;
            response.msg = "This account doesn't exist somehow.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

async function walletList(req, res) {
    var response = {}
    const {rUsername, rPassword} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    response = {
                        code: 0,
                        msg: "Wallets retrieved.",
                        wallet: []
                    }

                    for (let i = 0; i < userAccount.wallets.length; i++) {
                        const userWallet = await Wallet.findOne({publicKey: userAccount.wallets[i]});
                        response.wallet.push({
                            name: userWallet.name,
                            color: userWallet.color,
                            type: userWallet.type,
                            balance: userWallet.balance,
                            publicKey: userAccount.wallets[i],
                        });
                    }

                    res.send(response);
                } else {
                    response.code = 1;
                    response.msg = "Failed to find wallets. Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 2;
            response.msg = "This account doesn't exist somehow.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }

}

async function getWallet(req, res) {
    var response = {}
    const {rUsername, rPassword, rPublicKey} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    if (userAccount.wallets.indexOf(rPublicKey) >= 0) {
                        const userWallet = await Wallet.findOne({publicKey: rPublicKey});
                        response = {
                            code: 0,
                            msg: "Wallets retrieved.",
                            wallet: {
                                name: userWallet.name,
                                balance: userWallet.balance,
                                creator: userWallet.creator,
                                currentUser: userWallet.currentUser,
                                type: userWallet.type,
                                color: userWallet.color,
                                transactions: userWallet.transactions,
                                walletDescription: userWallet.walletDescription,
                                currency: userWallet.currency,
                            }
                        }
                    } else {
                        response = {
                            code: 1,
                            msg: "Wallet isn't appended to this account.",
                            wallet: null
                        }
                    }

                    res.send(response);
                } else {
                    response.code = 1;
                    response.msg = "Failed to find wallets. Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 2;
            response.msg = "This account doesn't exist somehow.";
            res.send(response);
        }
    } catch (err) {
        console.log(err);
    }
}

async function updateWalletSettings() {
    var response = {}
    const {rUsername, rPassword, rPublicKey, rName, rColor, rWalletDescription} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    await Wallet.findOneAndUpdate(
                        {publicKey: rPublicKey},
                        {
                            name: rName,
                            color: rColor,
                            walletDescription: rWalletDescription
                        },
                        {new: true}
                    );
                    response.code = 0;
                    response.msg = "Your wallet details have ben updated.";
                    res.send(response);
                } else {
                    response.code = 1;
                    response.msg = "Failed to update wallet. Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 2;
            response.msg = "This account doesn't exist somehow.";
            res.send(response);
        }
    } catch (err) {
        console.log(err);
    }
}

async function getPrivateKey() {
    var response = {}
    const {rUsername, rPassword, rPublicKey} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const userWallet = await Wallet.findOne({publicKey: rPublicKey});
                    if (userAccount.wallets.indexOf(userWallet.publicKey) >= 0) {
                        response.code = 0;
                        response.msg = "Your wallet details have ben updated.";
                        response.privateKey = userWallet.privateKey;
                    } else {
                        response.code = 1;
                        response.msg = "This wallet isn't associated with your account.";
                        response.privateKey = null;
                    }
                    res.send(response);
                } else {
                    response.code = 1;
                    response.msg = "Failed to retrieve private key. Log into your account.";
                    response.privateKey = null;
                    res.send(response);
                }
            });
        } else {
            response.code = 2;
            response.msg = "This account doesn't exist somehow.";
            response.privateKey = null;
            res.send(response);
        }
    } catch (err) {
        console.log(err);
    }
}

async function removeWallet() {
    var response = {}
    const {rUsername, rPassword, rPublicKey} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const userWallet = await Wallet.findOne({publicKey: rPublicKey});
                    if (userWallet != null) {
                        if (userAccount.wallets.indexOf(userWallet.publicKey) < 0) {
                            response = {
                                code: 0,
                                msg: "This wallet has been removed from your account.",
                            }

                            await Account.findOneAndUpdate(
                                {username: rUsername},
                                {
                                    $pull: {wallets: rPublicKey},
                                },
                                {new: true}
                            );
                        } else {
                            response = {
                                code: 1,
                                msg: "This wallet already doesn't exists on this account.",
                                wallet: {}
                            }
                        }
                    } else {
                        response = {
                            code: 1,
                            msg: "This key isn\'t associated with a wallet.",
                            wallet: {}
                        }
                    }

                    res.send(response);
                } else {
                    response.code = 2;
                    response.msg = "Failed to find wallet. Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 3;
            response.msg = "This account doesn't exist somehow.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    createWallet: createWallet,
    singleWallet: singleWallet,
    walletList: walletList,
    getWallet: getWallet,
    updateWalletSettings: updateWalletSettings,
    getPrivateKey: getPrivateKey,
    removeWallet: removeWallet
}