require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

require('./model/Challenge.js');
const Challenge = mongoose.model('challenges');

require('./model/Tournament.js');
const Tournament = mongoose.model('tournaments');

require('./model/Room.js');
const Room = mongoose.model('rooms');

async function retrieve(req, res) {
    var responseData = {};
    var delete_later = {};
    const {rUsername, rPassword} = req.body;
    
    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            var notificationArray = [];
            var pendingArray = [];
            for (let i = 0; i < userAccount.notification.length; i++) {
                if (userAccount.notification[i].type == "Challenge") {
                    const challenge = await Challenge.findOne({idString: userAccount.notification[i].idString});
                    const time = await require('./get-date-difference.js').dateDifference(challenge.timeCreated, Date.now());
                    if (challenge != null) {
                        if (Math.abs(parseInt(Date.now()) - parseInt(challenge.timeCreated.getTime())) < 86400000) {
                            const notification = {
                                type: "Challenge",
                                idString: userAccount.notification[i].idString,
                                host: challenge.host,
                                inviteMode: challenge.inviteMode,
                                game: challenge.game,
                                stakingAmount: challenge.stakingAmount,
                                winningAmount: challenge.winningAmount,
                                value: time.value,
                                metric: time.metric,
                                joined: 0
                            };
                            
                            notificationArray.push(notification);
                        } else {
                            await Account.findOneAndUpdate(
                                {username: rUsername},
                                {
                                    $pull: {
                                        notification: {
                                            type: "Challenge",
                                            idString: userAccount.notification[i].idString,
                                        }
                                    }
                                },
                                {new: true},
                            );
                        }
                    }
                } else if (userAccount.notification[i].type == "Tournament") {
                    const tournament = await Tournament.findOne({idString: userAccount.notification[i].idString});
                    const time = await require('./get-date-difference.js').dateDifference(tournament.timeCreated, Date.now());
                    if (tournament != null) {
                        if (Math.abs(parseInt(Date.now()) - parseInt(tournament.timeCreated.getTime())) < 86400000) {
                            const notification = {
                                type: "Tournament",
                                idString: userAccount.notification[i].idString,
                                host: tournament.host,
                                inviteMode: tournament.inviteMode,
                                game: tournament.game,
                                stakingAmount: tournament.stakingAmount,
                                winningAmount: tournament.winningAmount,
                                playerNumber: tournament.playerNumber,
                                value: time.value,
                                metric: time.metric,
                                joined: tournament.accepted != null ? tournament.accepted.Length : 0,
                            };
                            
                            notificationArray.push(notification);
                        } else {
                            await Account.findOneAndUpdate(
                                {username: rUsername},
                                {
                                    $pull: {
                                        notification: {
                                            type: "Tournament",
                                            idString: userAccount.notification[i].idString,
                                        }
                                    }
                                },
                                {new: true},
                            );
                        }
                    }
                }
            }
            for (let i = 0; i < userAccount.pendingGames.length; i++) {
                const room = await Room.findOne({roomID: userAccount.pendingGames[i]});
                if (room != null) {
                    const time = await require('./get-date-difference.js').dateDifference(room.date, Date.now());
                    var tor;
                    if (room.type == "Tournament") {
                        tor = await Tournament.findOne({idString: room.gameID});
                    } else if (room.type == "Challenge") {
                        tor = await Challenge.findOne({idString: room.gameID});
                    }
                    const pending = {
                        idString: userAccount.pendingGames[i],
                        game: room.game,
                        playerSize: room.playerSize,
                        type: room.type,
                        gameID: room.gameID,
                        value: time.value,
                        metric: time.metric,
                        readyToPlay: tor.readyToPlay
                    };
                    
                    pendingArray.push(pending);
                }
            }

            bcrypt.compare(rPassword, userAccount.password, (err, result) => {
                if (err) {
                    console.error(err);
                    return;
                }
                
                if (result) {
                    responseData.code = 0;
                    responseData.msg = "Information retrieved";
                    responseData.data = {
                        idName: userAccount.idName,
                        firstName: userAccount.firstName,
                        lastName: userAccount.lastName,
                        otherName: userAccount.otherName,
                        funds: userAccount.funds,
                        phoneNo: userAccount.phoneNo,
                        about: userAccount.about,
                        notifications: notificationArray,
                        pendingGames: pendingArray,
                        rejectedInvites: userAccount.rejectedInvites ? userAccount.rejectedInvites : [],
                        transactions: userAccount.gameTransact.reverse().slice(0, 2),
                        profilePic:  userAccount.profilePic ? userAccount.profilePic.toString('hex') : null
                    }
                    res.send(responseData);
                    console.log(responseData);
                } else {
                    responseData.code = 1;
                    responseData.msg = "Error";
                    responseData.data = null;
                    res.send(responseData);
                }
            });
        } else {
            responseData.code = 2;
            responseData.msg = "Error";
            responseData.data = null;
            res.send(responseData);
        }
    } catch (error) {
        console.log(error);
    }
}

async function getChallenges(req, res) {
    var responseData = {};
    const {rUsername, rPassword} = req.body;
    
    try {
        const pipeline = [
            {
                '$search': {
                    'index': 'account_retrieval',
                    'text': {
                        'query': rUsername,
                        'path': 'username'
                    }
                }
            }
        ];

        const accountResult = await Account.aggregate(pipeline);
        const userAccount = accountResult[0];

        const userChallenge = await Challenge.find({inviteMode: 0});
        const userTournament = await Tournament.find({inviteMode: 0});

        const userChallengeLength = userChallenge.length > 25 && userChallenge != null ? 25 : userChallenge.length;
        const userTournamentLength = userTournament.length > 25 && userTournament != null ? 25 : userTournament.length;

        if (userAccount != null) {
            var notificationArray = [];
            for (let i = 0; i < userChallengeLength; i++) {
                if (userChallenge[i] != null && userChallenge[i].host != rUsername) {
                    const time = await require('./get-date-difference.js').dateDifference(userChallenge[i].timeCreated, Date.now());

                    const notification = {
                        type: "Challenge",
                        idString: userChallenge[i].idString,
                        host: userChallenge[i].host,
                        inviteMode: userChallenge[i].inviteMode,
                        game: userChallenge[i].game,
                        stakingAmount: userChallenge[i].stakingAmount,
                        winningAmount: userChallenge[i].winningAmount,
                        timeCreated: userChallenge[i].timeCreated,
                        value: time.value,
                        metric: time.metric,
                        accepted: 0,
                    };
                    
                    notificationArray.push(notification);
                }
            }
            for (let i = 0; i < userTournamentLength; i++) {
                const time = await require('./get-date-difference.js').dateDifference(userTournament[i].timeCreated, Date.now());

                if (userTournament[i] != null && userTournament[i].host != rUsername) {
                    const notification = {
                        type: "Tournament",
                        idString: userTournament[i].idString,
                        host: userTournament.host,
                        inviteMode: userTournament.inviteMode,
                        game: userTournament.game,
                        stakingAmount: userTournament.stakingAmount,
                        winningAmount: userTournament.winningAmount,
                        playerNumber: userTournament.playerNumber,
                        timeCreated: userTournament.timeCreated,
                        value: time.value,
                        metric: time.metric,
                        accepted: userTournament.accepted.Length,
                    };
                    
                    notificationArray.push(notification);
                }
            }

            await require('./generate-whot-stack.js').shuffleArray(notificationArray);

            bcrypt.compare(rPassword, userAccount.password, (err, result) => {
                if (err) {
                    console.error(err);
                    return;
                }
                
                if (result) {
                    responseData.code = 0;
                    responseData.msg = "Information retrieved";
                    responseData.notification = notificationArray;
                    res.send(responseData);
                } else {
                    responseData.code = 1;
                    responseData.msg = "Error";
                    responseData.data = null;
                    res.send(responseData);
                }
            });
        } else {
            responseData.code = 2;
            responseData.msg = "Error";
            responseData.data = null;
            res.send(responseData);
        }
    } catch (error) {
        console.log(error);
    }
}

async function refundChallenge(req, res) {
    var response = {};
    const {rPassword, rIdString, rUsername, rType, rRefund} = req.body;

    const userAccount = await Account.findOne({username: rUsername});
    if (userAccount) {
        bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
            if (err) {
                console.log(err);
                return;
            }

            if (result) {
                if (rType == "Challenge") {
                    const inviteChallenge = await Challenge.findOne({idString: rIdString});
                    if (inviteChallenge) {
                        if (inviteChallenge.host == rUsername) {
                            if (Math.abs(parseInt(Date.now) - parseInt(inviteChallenge.timeCreated.getTime())) > 86400000) {
                                if (inviteChallenge.accepted == null) {
                                    if (rRefund == 1) {
                                        if (inviteChallenge.inviteMode == 1) {
                                            await Challenge.findOneAndDelete({idString: rIdString});
                                            await Account.findOneAndUpdate(
                                                {username: rUsername},
                                                {
                                                    funds: parseFloat(userAccount.funds) + parseFloat(inviteChallenge.stakingAmount),
                                                    $pull: {
                                                        challenge: rIdString,
                                                    },
                                                },
                                                {new: true}
                                            );

                                            res.send("This challenge has been deleted and your money has been refunded.");
                                        } else if (inviteChallenge.inviteMode == 0) {
                                            res.send("This challenge is an open one, you can't refund it.");
                                        }
                                    } else if (rRefund == 0) {
                                        await Challenge.findOneAndUpdate(
                                            {idString: rIdString},
                                            {inviteMode: 0},
                                            {new: true},
                                        );
                                        res.send("This challenge is now an open one.");
                                    }
                                } else {
                                    res.send("This challenge has been accepted by the invitee.");
                                }
                            } else {
                                res.send("You can't take such action, the challenge is less than 24 hours old.");
                            }
                        } else {
                            res.send("You aren't the host of this challenge.");
                        }
                    } else {
                        res.send("This challenge no longer exists.");
                    }
                } else if (rType == "Tournament") {
                    const inviteTournament = await Tournament.findOne({idString: rIdString});
                    if (inviteTournament) {
                        if (inviteTournament.host == rUsername) {
                            if (Math.abs(parseInt(Date.now) - parseInt(inviteTournament.timeCreated.getTime())) > 86400000) {
                                if (inviteTournament.accepted.length < inviteTournament.playerNumber - 1) {
                                    if (rRefund == 1) {
                                        if (inviteTournament.inviteMode == 1) {
                                            await Tournament.findOneAndDelete({idString: rIdString});
                                            await Account.findOneAndUpdate(
                                                {username: rUsername},
                                                {
                                                    funds: parseFloat(userAccount.funds) + parseFloat(inviteTournament.stakingAmount),
                                                    $pull: {
                                                        tournament: rIdString,
                                                    },
                                                },
                                                {new: true}
                                            );
                                            for (let i = 0; i < inviteTournament.accepted.length; i++) {
                                                const otherAccount = await Account.findOne({username: rUsername});
                                                await Account.findOneAndUpdate(
                                                    {username: inviteTournament.accepted[i]},
                                                    {
                                                        funds: parseFloat(otherAccount.funds) + parseFloat(inviteTournament.stakingAmount)
                                                    },
                                                    {new: true}
                                                );
                                            }

                                            res.send("This tournament has been deleted and your money has been refunded.");
                                        } else if (inviteTournament.inviteMode == 0) {
                                            res.send("This tournament is an open one, you can't refund it.");
                                        }
                                    } else if (rRefund == 0) {
                                        await Tournament.findOneAndUpdate(
                                            {idString: rIdString},
                                            {inviteMode: 0},
                                            {new: true},
                                        );
                                        res.send("This tournament is now an open one.");
                                    }
                                } else {
                                    res.send("This tournament has been accepted by every invitee.");
                                }
                            } else {
                                res.send("You can't take such action, the tournament is less than 24 hours old.");
                            }
                        } else {
                            res.send("You aren't the host of this tournament.");
                        }
                    } else {
                        res.send("This tournament no longer exists.");
                    }
                } 
            } else {
                response.code = 2;
                response.msg = "Log into your account.";

                res.send(response.msg);
                console.log(response);
            }
        });
    } else {
        res.send("Error");
    }
}


module.exports = {
    retrieve: retrieve,
    getChallenges, getChallenges,
    refundChallenge, refundChallenge,
}