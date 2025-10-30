const mongoose = require('mongoose');
const {Schema} = mongoose;

const ballSchema = new Schema({
    ball_number: Number,
    ball_xPos: Number,
    ball_yPos: Number,
    ball_type: String,
    ball_potted: Boolean
});

const whiteSchema = new Schema({
    potted: Boolean,
    player: String
});

const poolLobbySchema = new Schema({
    lobbyID: String,
    roomID: String,
    player1: String,
    player2: String,
    player1_ball: String,
    player2_ball: String,
    lastPlayer: String,
    balls: [ballSchema],
    pottedWhite: whiteSchema,
    winner: String,
    money: Number,
    paid: Boolean,
    finals: Number,
    refreshed: Number,
});

mongoose.model('poolLobbys', poolLobbySchema);