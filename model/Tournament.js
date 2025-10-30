const mongoose = require('mongoose');
const {Schema} = mongoose;

const tournamentSchema = new Schema({
    idString: String,
    host: String,
    inviteMode: Number,
    game: String,
    stakingAmount: Number,
    winningAmount: Number,
    playerNumber: Number,
    players: [String],
    accepted: [String],
    declined: [String],
    readyToPlay: Boolean,
    roomID: String,
    timeCreated: Date
});

mongoose.model('tournaments', tournamentSchema);