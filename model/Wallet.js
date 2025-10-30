const mongoose = require('mongoose');
const {Schema} = mongoose;

const transactionSchema = new Schema({
    idString: String,
    category: String,
    type: Boolean,
    status: String,
    amount: Number,
    time: Date,
    note: String
});

const walletSchema = new Schema({
    name: String,
    publicKey: String,
    privateKey: String,
    balance: Number,
    creator: String,
    currentUser: String,
    type: String,
    color: String,
    transactions: [transactionSchema],
    walletDescription: String,
    currency: String
});

mongoose.model('wallets', walletSchema);