const mongoose = require('mongoose');
const {Schema} = mongoose;

const challengeSchema = new Schema({
    idString: String,
    host: String,
    inviteMode: Number,
    game: String,
    stakingAmount: Number,
    winningAmount: Number,
    opponent: String,
    accepted: String,
    declined: String,
    readyToPlay: Boolean,
    roomID: String,
    timeCreated: Date
});

mongoose.model('challenges', challengeSchema);