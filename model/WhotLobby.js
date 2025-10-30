const mongoose = require('mongoose');
const {Schema} = mongoose;

const cardSchema = new Schema({
    shape: String,
    number: Number,
    cardID: String
});

const moveSchema = new Schema({
    player: String,
    card: cardSchema,
    market: Boolean,
    require: String
});

const whotLobbySchema = new Schema({
    lobbyID: String,
    roomID: String,
    stack: [cardSchema],
    player1: String,
    player1_stack: [cardSchema],
    player2: String,
    player2_stack: [cardSchema],
    moves: [moveSchema],
    winner: String,
    money: Number,
    paid: Boolean,
    finals: Number,
    refreshed: Number
});

mongoose.model('whotLobbys', whotLobbySchema);