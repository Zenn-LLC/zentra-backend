const mongoose = require('mongoose');
const {Schema} = mongoose;

const notificationSchema = new Schema({
    type: String,
    idString: String
});

const messageSchema = new Schema({
    otherUser: String,
    messageID: String
});

const moneyTransactSchema = new Schema({
    credit: Boolean,
    game: Boolean,
    theGame: String,
    amount: Number,
    date: String,
});

const gameTransactSchema = new Schema({
    win: Boolean,
    game: String,
    challenge: Boolean,
    amountInvolved: Number,
    date: String
});

const rejectedSchema = new Schema({
    type: String,
    idString: String,
    reason: String,
    username: String
});

const graphScoreSchema = new Schema({
    day: Number,
    gain: Number,
    loss: Number,
});

const accountSchema = new Schema({
    phoneNo: String,
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    otherName: String,
    idName: String,
    about: String,
    wallets: [String],
    rank: Number,
    profilePic: Buffer,
    lastAuth: Date,
    challenge: [String],
    tournament: [String],
    rejectedInvites: [rejectedSchema],
    notification: [notificationSchema],
    messages: [messageSchema],
    followers: [String],
    following: [String],
    pendingGames: [String],
    gameTransact: [gameTransactSchema],
    moneyTransact: [moneyTransactSchema],
    achievements: [Number],
    points: Number,
    graphScore: [graphScoreSchema],
    verified: Boolean,
    deactivated: Boolean,
});

mongoose.model('accounts', accountSchema);