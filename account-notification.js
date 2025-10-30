require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Challenge.js');
const Challenge = mongoose.model('challenges');
require('./model/Tournament.js');
const Tournament = mongoose.model('tournaments');

async function retrieveNotification(req, res) {
    var responseData = {}
    const {rType, rIdString} = req.body;
    if (rType == "Challenge") {
        var notif = await Challenge.findOne({idString: rIdString});
        if (notif != null) {
            responseData.code = 0;
            responseData.msg = "Challenge retrieved";
            responseData.host = notif.host,
            responseData.inviteMode = notif.inviteMode,
            responseData.game = notif.game,
            responseData.stakingAmount = notif.stakingAmount,
            responseData.winningAmount = notif.winningAmount,
            responseData.timeCreated = notif.timeCreated
            res.send(responseData);
        } else {
            responseData.code = 1;
            responseData.msg = "Error";
            responseData.data = null;
            res.send(responseData);
        }
    } else if (rType == "Tournament") {
        var notif = await Tournament.findOne({idString: rIdString});
        if (notif != null) {
            responseData.code = 0;
            responseData.msg = "Tournament retrieved";
            responseData.host = notif.host,
            responseData.inviteMode = notif.inviteMode,
            responseData.game = notif.game,
            responseData.stakingAmount = notif.stakingAmount,
            responseData.winningAmount = notif.winningAmount,
            responseData.playerNumber = notif.playerNumber,
            responseData.timeCreated = notif.timeCreated
            res.send(responseData);
        } else {
            responseData.code = 1;
            responseData.msg = "Error";
            responseData.data = null;
            res.send(responseData);
        }
    }
}


module.exports = {
    retrieveNotification: retrieveNotification
}