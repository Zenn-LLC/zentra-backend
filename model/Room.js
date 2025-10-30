const mongoose = require('mongoose');
const {Schema} = mongoose;

const playerSchema = new Schema({
    player: String,
    ready: Boolean,
    arrive: Boolean
});

const roomSchema = new Schema({
    roomID: String,
    players: [playerSchema],
    game: String,
    playerSize: Number,
    type: String,
    gameID: String,
    ready: Boolean,
    lobbyID: [String],
    finalInt: Number,
    date: Date,
});

mongoose.model('rooms', roomSchema);