require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
require('./model/Challenge.js');
require('./model/Room.js');
require('./model/WhotLobby.js');
require('./model/LudoLobby.js');
require('./model/PoolLobby.js');
const Account = mongoose.model('accounts');
const Challenge = mongoose.model('challenges');
const Room = mongoose.model('rooms');
const WhotLobby = mongoose.model('whotLobbys');
const LudoLobby = mongoose.model('ludoLobbys');
const PoolLobby = mongoose.model('poolLobbys');

async function createChallenge(req, res) {
    var response = {}

    try {
        const userAccount = await Account.findOne({username: req.body.rUsername});
        if (userAccount != null) {
            bcrypt.compare(req.body.rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    if (userAccount.funds >= req.body.rStakingAmount) {
                        const f4s = await require('./generate-string.js').generateRandomString(4);
                        const s4s = await require('./generate-string.js').generateRandomString(4);

                        const idStr = "chal-" + f4s + "-" + s4s + "-xyz";
                        const roomID = await require('./generate-string.js').generateRandomString(50);
                        const lobbyID = await require('./generate-string.js').generateRandomString(36);
                        if (req.body.rMode == 1) {
                            var newChallenge = new Challenge({
                                idString: idStr,
                                host: userAccount.username,
                                inviteMode: req.body.rMode,
                                game: req.body.rGame,
                                stakingAmount: req.body.rStakingAmount,
                                winningAmount: req.body.rStakingAmount*1.8,
                                opponent: req.body.rOpponent,
                                accepted: null,
                                declined: null,
                                readyToPlay: false,
                                roomID: roomID,
                                timeCreated: Date.now()
                            });
                            await newChallenge.save();

                            await Account.findOneAndUpdate(
                                {username: req.body.rUsername},
                                {$push: {challenge: idStr}},
                                {new: true}
                            );

                            const newNotification = {
                                type: "Challenge",
                                idString: idStr
                            }

                            await Account.findOneAndUpdate(
                                {username: req.body.rOpponent},
                                {$push: {notification: newNotification}},
                                {new: true}
                            );
                        } else {
                            var newChallenge = new Challenge({
                                idString: idStr,
                                host: userAccount.username,
                                inviteMode: req.body.rMode,
                                game: req.body.rGame,
                                stakingAmount: req.body.rStakingAmount,
                                winningAmount: req.body.rStakingAmount*1.8,
                                opponent: null,
                                accepted: null,
                                declined: null,
                                readyToPlay: false,
                                roomID: roomID,
                                timeCreated: Date.now()
                            });
                            await newChallenge.save();

                            await Account.findOneAndUpdate(
                                {username: req.body.rUsername},
                                {$push: {challenge: idStr}},
                                {new: true}
                            );
                        }

                        var newRoom = new Room({
                            roomID: roomID,
                            players: [],
                            game: req.body.rGame,
                            playerSize: 2,
                            type: "Challenge",
                            gameID: idStr,
                            ready: false,
                            lobbyID: [lobbyID],
                            finalInt: Math.log(2) / Math.log(2),
                            date: Date.now(),
                        });
                        await newRoom.save();

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
                                money: req.body.rStakingAmount*1.8,
                                paid: false,
                                finals: 1,
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
                                money: req.body.rStakingAmount*1.8,
                                paid: false,
                                finals: 1,
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
                                money: req.body.rStakingAmount*1.8,
                                paid: false,
                                finals: 1,
                            });
                            await newPoolLobby.save();
                        }
            
                        
                        const newMoney = userAccount.funds - req.body.rStakingAmount;
                        await Account.findOneAndUpdate({username: req.body.rUsername}, {funds: newMoney}, {new: true});
            
                        response.code = 0;
                        response.msg = "You are hosting a new challenge!";
                        res.send(response);
                    } else {
                        response.code = 1;
                        response.msg = "Your balance is insufficient. Fund your account or stake a lower amount.";
                        res.send(response);
                    }
                } else {
                    response.code = 2;
                    response.msg = "Failed to host challenge. Log into your account.";
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

async function acceptChallenge(req, res) {
    var response = {};
    const {rPassword, rChallenge, rUsername} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const inviteChallenge = await Challenge.findOne({idString: rChallenge});
                    if (inviteChallenge) {
                        if (userAccount.funds > inviteChallenge.stakingAmount) {
                            if (inviteChallenge.accepted != rUsername) {
                                if (inviteChallenge.declined != rUsername) {
                                    if (inviteChallenge.accepted == null) {
                                        if ((inviteChallenge.opponent == rUsername && inviteChallenge.inviteMode == 1) || inviteChallenge.inviteMode == 0) {
                                            const timeDiff = Math.abs(parseInt(Date.now()) - parseInt(inviteChallenge.timeCreated.getTime()));
                                            if ((timeDiff < 86400000 && inviteChallenge.inviteMode == 1) || inviteChallenge.inviteMode == 0) {
                                                await Challenge.findOneAndUpdate(
                                                    {idString: rChallenge},
                                                    {accepted: rUsername, readyToPlay: true},
                                                    {new: true}
                                                );
                                
                                                await Account.findOneAndUpdate(
                                                    {username: inviteChallenge.host},
                                                    {$push: {pendingGames: inviteChallenge.roomID}},
                                                    {new: true}
                                                );

                                                var newMoney = parseFloat(userAccount.funds) - parseFloat(inviteChallenge.stakingAmount);
                                                await Account.findOneAndUpdate(
                                                    {username: rUsername},
                                                    {
                                                        $push: {pendingGames: inviteChallenge.roomID},
                                                        funds: parseInt(newMoney),
                                                        $pull: {
                                                            notification: {
                                                                type: "Challenge",
                                                                idString: rChallenge
                                                            }
                                                        }
                                                    },
                                                    {new: true}
                                                );

                                                await Room.findOneAndUpdate(
                                                    {roomID: inviteChallenge.roomID},
                                                    {date: Date.now()},
                                                    {new: true}
                                                );
                                                
                                                response.code = 0;
                                                response.msg = "You have accepted invite!";
                                                res.send(response.msg);
                                            } else {
                                                response.code = 0;
                                                response.msg = "This challenge invite has expired.";
                                                res.send(response.msg);
                                            }
                                        } else {
                                            response.code = 0;
                                            response.msg = "This invite is not for you!";
                                            res.send(response.msg);
                                        }
                                    } else {
                                        response.code = 0;
                                        response.msg = "Someone else has already accepted challenge!";
                                        res.send(response.msg);
                                    }
                                } else {
                                    response.code = 0;
                                    response.msg = "You can't accept this challenge, you've declined it.";
                                    res.send(response.msg);
                                }
                            } else {
                                response.code = 0;
                                response.msg = "You have already accepted challenge!";
                                res.send(response.msg);
                            }
                        } else {
                            res.send("Insufficient funds.");
                        }
                    } else {
                        res.send("Challenge doesn't exist anymore.");
                    }
                } else {
                    res.send("Log into your account");
                }
            });
        } else {
            res.send("Error");
        }
    } catch (error) {
        console.log(error);
    }
}

async function declineChallenge(req, res) {
    var response = {};
    const {rPassword, rChallenge, rUsername, rReason} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const inviteChallenge = await Challenge.findOne({idString: rChallenge});
                    if (inviteChallenge) {
                        if (inviteChallenge.accepted != rUsername) {
                            if (inviteChallenge.declined != rUsername) {
                                if (inviteChallenge.inviteMode == 1) {
                                    if (inviteChallenge.opponent == rUsername) {
                                        const timeDiff = Math.abs(parseInt(Date.now()) - parseInt(inviteChallenge.timeCreated.getTime()));
                                        if ((timeDiff < 86400000 && inviteChallenge.inviteMode == 1) || inviteChallenge.inviteMode == 0) {
                                            await Challenge.findOneAndUpdate(
                                                {idString: rChallenge},
                                                {declined: rUsername},
                                                {new: true}
                                            );

                                            await Account.findOneAndUpdate(
                                                {username: inviteChallenge.host},
                                                {
                                                    $push: {
                                                        rejectedInvites: {
                                                            type: "Challenge",
                                                            idString: rChallenge,
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
                                                            type: "Challenge",
                                                            idString: rChallenge
                                                        }
                                                    }
                                                },
                                                {new: true}
                                            );
                                            response.code = 0;
                                            response.msg = "You have declined challenge invite.";
                                            res.send(response.msg);
                                            console.log(response.msg);
                                        } else {
                                            response.code = 0;
                                            response.msg = "This challenge invite has expired.";
                                            res.send(response.msg);
                                            console.log(response.msg);
                                        }
                                    } else {
                                        response.code = 0;
                                        response.msg = "You can't decline this challenge, it was never sent to you.";
                                        res.send(response.msg);
                                        console.log(response.msg);
                                    }
                                } else {
                                    response.code = 0;
                                    response.msg = "You can't decline an open challenge.";
                                    res.send(response.msg);
                                    console.log(response.msg);
                                }
                            } else {
                                response.code = 0;
                                response.msg = "You have already declined challenge invite!";
                                res.send(response.msg);
                                console.log(response.msg);
                            }
                        } else {
                            response.code = 0;
                            response.msg = "You can't decline this challenge, you've accepted it.";
                            res.send(response.msg);
                            console.log(response.msg);
                        }
                    } else {
                        res.send("Challenge doesn't exist anymore.");
                    }
                } else {
                    res.send("Log into your account");
                }
            });
        } else {
            res.send("Error");
        }
    } catch (error) {
        console.log(error);
    }
}

async function getChallenge(req, res) {
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
                    const inviteChallenge = await Challenge.findOne({idString: rIdString});
                    if (inviteChallenge) {
                        if (rUsername == inviteChallenge.host) {
                            response.code = 0;
                            response.msg = "Received.";
                            response.time = Math.abs(parseInt(Date.now()) - parseInt(inviteChallenge.timeCreated.getTime()));
                            response.readyToPlay = inviteChallenge.readyToPlay;
                            response.opponent = inviteChallenge.opponent != null ? [inviteChallenge.opponent] : [];
                            response.accepted = inviteChallenge.accepted != null ? [inviteChallenge.accepted] : [];
                            response.declined = inviteChallenge.declined != null ? [inviteChallenge.declined] : [];
        
                            res.send(response);
                            console.log(response);
                        } else {
                            response.code = 1;
                            response.msg = "You are not the host of this challenge.";
        
                            res.send(response);
                            console.log(response);
                        }
                    } else {
                        response.code = 1;
                        response.msg = "Challenge doesn't exist anymore.";

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
    createChallenge: createChallenge,
    acceptChallenge: acceptChallenge,
    declineChallenge: declineChallenge,
    getChallenge: getChallenge
}
