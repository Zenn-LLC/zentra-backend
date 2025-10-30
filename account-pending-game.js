require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Room.js');
const Room = mongoose.model('rooms');

async function retrievePendingGame(req, res) {
    var responseData = {}
    const {rIdString} = req.body;
    var notif = await Room.findOne({roomID: rIdString});
    if (notif) {
        responseData.code = 0;
        responseData.msg = "Room retrieved";
        responseData.game = notif.game,
        responseData.playerSize = notif.playerSize,
        responseData.type = notif.type,
        responseData.gameID = notif.gameID
        res.send(responseData);
    } else {
        responseData.code = 1;
        responseData.msg = "Error";
        responseData.data = null;
        res.send(responseData);
    }
}

module.exports = {
    retrievePendingGame: retrievePendingGame
}