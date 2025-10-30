const mongoose = require('mongoose');
const {Schema} = mongoose;

const pieceSchema = new Schema ({
    color: String,
    step: Number,
    ordinal: Number,
    ended: Boolean, 
});

const moveSchema = new Schema({
    player: String,
    dice: [Number],
    move_1: Boolean,
    move_2: Boolean,
    date: String
});

const ludoLobbySchema = new Schema({
    lobbyID: String,
    roomID: String,
    player1: String,
    red: [pieceSchema],
    blue: [pieceSchema],
    player2: String,
    green: [pieceSchema],
    yellow: [pieceSchema],
    lastPlayer: String,
    moves: [moveSchema],
    winner: String,
    diceRoll: Boolean,
    money: Number,
    paid: Boolean,
    finals: Number,
    refreshed: Number,
});

mongoose.model('ludoLobbys', ludoLobbySchema);