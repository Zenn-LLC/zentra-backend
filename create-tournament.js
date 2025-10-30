require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
require('./model/Tournament.js');
require('./model/Room.js');
require('./model/WhotLobby.js');
require('./model/LudoLobby.js');
require('./model/PoolLobby.js');
const Tournament = mongoose.model('tournaments');
const Account = mongoose.model('accounts');
const Room = mongoose.model('rooms');
const WhotLobby = mongoose.model('whotLobbys');
const LudoLobby = mongoose.model('ludoLobbys');
const PoolLobby = mongoose.model('poolLobbys');

async function createTournament(req, res) {
    var response = {}

    try {
        var userAccount = await Account.findOne({username: req.body.rUsername});
        if (userAccount != null) {
            bcrypt.compare(req.body.rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                }

                if (result) {
                    if (userAccount.funds >= req.body.rStakingAmount) {
                        const idStr = await require('./generate-string.js').generateRandomString(42);
                        const roomID = await require('./generate-string.js').generateRandomString(50);
                        if (req.body.rMode == 1) {
                            var playerArray = await req.body.rPlayers.split(",");
                            var newTournament = new Tournament({
                                idString: idStr,
                                host: userAccount.username,
                                inviteMode: req.body.rMode,
                                game: req.body.rGame,
                                stakingAmount: req.body.rStakingAmount,
                                winningAmount: req.body.rStakingAmount*req.body.rPlayerNumber*0.9,
                                playerNumber: req.body.rPlayerNumber,
                                players: playerArray,
                                accepted: null,
                                declined: null,
                                readyToPlay: false,
                                roomID: roomID,
                                timeCreated: Date.now()
                            });
                            await newTournament.save();

                            await Account.findOneAndUpdate(
                                {username: req.body.rUsername},
                                {$push: {tournament: idStr}},
                                {new: true}
                            );

                            const newNotification = {
                                type: "Tournament",
                                idString: idStr
                            }
                            for (var i = 0; i < playerArray.length; i++) {
                                await Account.findOneAndUpdate(
                                    {username: playerArray[i]},
                                    {$push: {notification: newNotification}},
                                    {new: true}
                                );
                            }
                        } else {
                            var newTournament = new Tournament({
                                idString: idStr,
                                host: userAccount.username,
                                inviteMode: req.body.rMode,
                                game: req.body.rGame,
                                stakingAmount: req.body.rStakingAmount,
                                winningAmount: req.body.rStakingAmount*req.body.rPlayerNumber*0.9,
                                playerNumber: req.body.rPlayerNumber,
                                players: null,
                                accepted: null,
                                declined: null,
                                readyToPlay: false,
                                roomID: roomID,
                                timeCreated: Date.now()
                            });
                            await newTournament.save();

                            await Account.findOneAndUpdate(
                                {username: req.body.rUsername},
                                {$push: {tournament: idStr}},
                                {new: true}
                            );
                        }

                        var games = [];

                        for (var i = 0; i < req.body.rPlayerNumber / 2; i++) {
                            const lobbyID = await require('./generate-string.js').generateRandomString(36);
                            games.push(lobbyID);
                            if (req.body.rGame == 'Whots') {
                                var newWhotLobby = new WhotLobby({
                                    lobbyID: lobbyID,
                                    roomID: roomID,
                                    stack: [],
                                    player1: null,
                                    player1_stack: [],
                                    player2: null,
                                    player2_stack: [],
                                    moves: [],
                                    winner: null,
                                    money: req.body.rStakingAmount*req.body.rPlayerNumber*0.9,
                                    paid: false,
                                    finals: Math.log(req.body.rPlayerNumber) / Math.log(2),
                                });
                                await newWhotLobby.save();
                            } else if (req.body.rGame == 'Ludo') {
                                var newLudoLobby = new LudoLobby({
                                    lobbyID: lobbyID,
                                    roomID: roomID,
                                    player1: null,
                                    red: [],
                                    blue: [],
                                    player2: null,
                                    green: [],
                                    yellow: [],
                                    lastPlayed: null,
                                    moves: [],
                                    winner: null,
                                    diceRoll: false,
                                    money: req.body.rStakingAmount*req.body.rPlayerNumber*0.9,
                                    paid: false,
                                    finals: Math.log(req.body.rPlayerNumber) / Math.log(2),
                                });
                                await newLudoLobby.save();
                            } else if (req.body.rGame == 'Pool') {
                                var newPoolLobby = new PoolLobby({
                                    lobbyID: lobbyID,
                                    roomID: roomID,
                                    player1: null,
                                    player2: null,
                                    player1_ball: null,
                                    player2_ball: null,
                                    lastPlayer: null,
                                    balls: [],
                                    pottedWhite: null,
                                    winner: null,
                                    money: req.body.rStakingAmount*req.body.rPlayerNumber*0.9,
                                    paid: false,
                                    finals: Math.log(req.body.rPlayerNumber) / Math.log(2),
                                });
                                await newPoolLobby.save();
                            }
                        }

                        var newRoom = new Room({
                            roomID: roomID,
                            players: [],
                            game: req.body.rGame,
                            playerSize: req.body.rPlayerNumber,
                            type: "Tournament",
                            gameID: idStr,
                            ready: false,
                            lobbyID: games,
                            finalInt: Math.log(req.body.rPlayerNumber) / Math.log(2),
                            date: Date.now(),
                        });
                        await newRoom.save();
            
                        
                        var newMoney = userAccount.funds - req.body.rStakingAmount;
                        await Account.findOneAndUpdate(
                            {username: req.body.rUsername},
                            {
                                funds: newMoney,
                                $push: {
                                    pendingGames: roomID
                                }
                            },
                            {new: true}
                        );
            
                        response.code = 0;
                        response.msg = "You are hosting a new tournament!";
                        res.send(response);
                    } else {
                        response.code = 1;
                        response.msg = "Your balance is insufficient. Fund your account or stake a lower amount.";
                        res.send(response);
                    }
                } else {
                    response.code = 2;
                    response.msg = "Failed to host tournament. Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 3;
            response.msg = "This account doesn't exist somehow.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

async function acceptTournament(req, res) {
    var response = {};
    const {rPassword, rUsername, rTournament} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        const inviteTournament = await Tournament.findOne({idString: rTournament});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    if (inviteTournament) {
                        if (userAccount.funds > inviteTournament.stakingAmount) {
                            if (inviteTournament.accepted.indexOf(rUsername) == -1) {
                                if (inviteTournament.declined.indexOf(rUsername) == -1) {
                                    if (inviteTournament.accepted.length < inviteTournament.playerNumber - 1) {
                                        if ((inviteTournament.players.indexOf(rUsername) > -1  && inviteTournament.inviteMode == 1) || inviteTournament.inviteMode == 0) {
                                            const timeDiff = Math.abs(parseInt(Date.now()) - parseInt(inviteTournament.timeCreated.getTime()));
                                            if ((timeDiff < 86400000 && inviteTournament.inviteMode == 1) || inviteTournament.inviteMode == 0) {
                                                await Tournament.findOneAndUpdate(
                                                    {idString: rTournament},
                                                    {
                                                        $push: {
                                                            accepted: rUsername,
                                                            readyToPlay: inviteTournament.accepted.length == inviteTournament.playerNumber - 2 ? true : false
                                                        }
                                                    },
                                                    {new: true}
                                                );

                                                var newMoney = parseFloat(userAccount.funds) - parseFloat(inviteTournament.stakingAmount);
                                                await Account.findOneAndUpdate(
                                                    {username: rUsername},
                                                    {
                                                        funds: newMoney,
                                                        $push: {
                                                            pendingGames: inviteTournament.roomID
                                                        },
                                                        $pull: {
                                                            notification: {
                                                                type: "Tournament",
                                                                idString: rTournament
                                                            }
                                                        }
                                                    },
                                                    {new: true}
                                                );

                                                await Room.findOneAndUpdate(
                                                    {roomID: inviteChallenge.roomID},
                                                    {date: inviteTournament.accepted.length == inviteTournament.playerNumber - 2 ? Date.now() : null},
                                                    {new: true}
                                                );
                                    
                                                response.code = 0;
                                                response.msg = "You have accepted the invite!";
                                                res.send(response.msg);
                                            } else {
                                                response.code = 0;
                                                response.msg = "This tournament invite has expired.";
                                                res.send(response.msg);
                                            }
                                        } else {
                                            response.code = 0;
                                            response.msg = "You weren't invited to this tournament.";
                                            res.send(response.msg);
                                        }
                                    } else {
                                        response.code = 0;
                                        response.msg = "Looks like the tournament is already full.";
                                        res.send(response.msg);
                                    }
                                } else {
                                    response.code = 0;
                                    response.msg = "You can't accept this tournament, you've declined it.";
                                    res.send(response.msg);
                                }
                            } else {
                                response.code = 1;
                                response.msg = "You have already accepted the invite!";
                                res.send(response.msg);
                            }
                        } else {
                            response.code = 2;
                            response.msg = "You don't have sufficient balance.";
                            res.send(response.msg);
                        }
                    } else {
                        res.send("Tournament doesn't exist anymore.");
                    }
                } else {
                    res.send("Log into your account");
                }
            });
        } else {
            console.log("Error");
        }
    } catch (error) {
        console.log(error);
    }
}

async function declineTournament(req, res) {
    var response = {};
    const {rPassword, rUsername, rTournament, rReason} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        const inviteTournament = await Tournament.findOne({idString: rTournament});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    if (inviteTournament) {
                        if (inviteTournament.accepted.indexOf(rUsername) == -1) {
                            if (inviteTournament.declined.indexOf(rUsername) == -1) {
                                if (inviteTournament.inviteMode == 1) {
                                    if (inviteTournament.players.indexOf(rUsername) > -1) {
                                        const timeDiff = Math.abs(parseInt(Date.now()) - parseInt(inviteTournament.timeCreated.getTime()));
                                        if ((timeDiff < 86400000 && inviteTournament.inviteMode == 1) || inviteTournament.inviteMode == 0) {
                                            await Challenge.findOneAndUpdate(
                                                {idString: rChallenge},
                                                {
                                                    $push: {
                                                        declined: rUsername
                                                    },
                                                },
                                                {new: true}
                                            );

                                            await Account.findOneAndUpdate(
                                                {username: inviteTournament.host},
                                                {
                                                    $push: {
                                                        rejectedInvites: {
                                                            type: "Tournament",
                                                            idString: rTournament,
                                                            reason: rReason,
                                                            username: rUsername
                                                        }
                                                    }
                                                },
                                                {new: true}
                                            );

                                            await Account.findOneAndUpdate(
                                                {username: rUsername},
                                                {
                                                    $pull: {
                                                        notification: {
                                                            type: "Tournament",
                                                            idString: rTournament
                                                        }
                                                    }
                                                },
                                                {new: true}
                                            );
                                
                                            response.code = 0;
                                            response.msg = "You have declined the tournament invite.";
                                            res.send(response.msg);
                                        } else {
                                            response.code = 0;
                                            response.msg = "This tournament invited has expired.";
                                            res.send(response.msg);
                                            console.log(response.msg);
                                        }
                                    } else {
                                        response.code = 0;
                                        response.msg = "You can't decline this tournament, it was never sent to you.";
                                        res.send(response.msg);
                                        console.log(response.msg);
                                    }
                                } else {
                                    response.code = 1;
                                    response.msg = "You can't declined an open tournament.";
                                    res.send(response.msg);
                                }
                            } else {
                                response.code = 1;
                                response.msg = "You have already declined the tournament invite!";
                                res.send(response.msg);
                            }
                        } else {
                            response.code = 1;
                            response.msg = "You have already accepted the invite!";
                            res.send(response.msg);
                        }
                    } else {
                        res.send("Tournament doesn't exist anymore.");
                    }
                } else {
                    res.send("Log into your account");
                }
            });
        } else {
            console.log("Error");
        }
    } catch (error) {
        console.log(error);
    }
}

async function getTournament(req, res) {
    var response = {};
    const {rPassword, rIdString, rUsername} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const inviteTournament = await Tournament.findOne({idString: rIdString});
                    if (inviteTournament) {
                        if (rUsername == inviteTournament.host) {
                            response.code = 0;
                            response.msg = "Received.";
                            response.time = Math.abs(parseInt(Date.now()) - parseInt(inviteTournament.timeCreated.getTime()));
                            response.readyToPlay = inviteTournament.readyToPlay;
                            response.players = inviteTournament.players;
                            response.accepted = inviteTournament.accepted;
                            response.declined = inviteTournament.declined;
        
                            res.send(response);
                            console.log(response);
                        } else {
                            response.code = 1;
                            response.msg = "You are not the host of this tournament.";
        
                            res.send(response);
                            console.log(response);
                        }
                    } else {
                        response.code = 1;
                        response.msg = "Tournament doesn't exist anymore.";

                        res.send(response);
                        console.log(response);
                    }
                } else {
                    response.code = 2;
                    response.msg = "Log into your account.";

                    res.send(response);
                    console.log(response);
                }
            });
        } else {
            res.send("Error");
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    createTournament: createTournament,
    acceptTournament: acceptTournament,
    declineTournament: declineTournament,
    getTournament: getTournament,
}
