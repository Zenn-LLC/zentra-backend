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

async function getProfile(req, res) {
    var response = {}
    const {rUsername, rProfile} = req.params;

    try {
        const userAccount = await Account.findOne({username: rProfile});
        if (userAccount != null) {
            const time = await require('./get-date-difference.js').dateDifference(userAccount.lastAuth, Date.now());
            var chartValue = [];
            for (let i = 0; i < userAccount.graphScore.length; i++) {
                const gain = userAccount.graphScore[i].gain;
                const loss = userAccount.graphScore[i].loss;

                const chartKey = gain > loss ? (gain - loss)/gain : (gain - loss)/loss;
                chartValue.push(chartKey);
            }
            var challengeNotificationArray = [];
            var tournamentNotificationArray = [];
            for (let i = 0; i < userAccount.challenge.length; i++) {
                const challenge = await Challenge.findOne({idString: userAccount.challenge[i]});
                const time = await require('./get-date-difference.js').dateDifference(challenge.timeCreated, Date.now());
                if (challenge != null) {
                    const notification = {
                        type: "Challenge",
                        idString: userAccount.challenge[i],
                        host: challenge.host,
                        inviteMode: challenge.inviteMode,
                        game: challenge.game,
                        stakingAmount: challenge.stakingAmount,
                        winningAmount: challenge.winningAmount,
                        value: time.value,
                        metric: time.metric,
                        joined: 0
                    };
                    
                    challengeNotificationArray.push(notification);
                }
            }
            for (let i = 0; i < userAccount.tournament.length; i++) {
                const tournament = await Tournament.findOne({idString: userAccount.tournament[i]});
                const time = await require('./get-date-difference.js').dateDifference(tournament.timeCreated, Date.now());
                if (tournament != null) {
                    const notification = {
                        type: "Tournament",
                        idString: userAccount.tournament[i],
                        host: tournament.host,
                        inviteMode: tournament.inviteMode,
                        game: tournament.game,
                        stakingAmount: tournament.stakingAmount,
                        winningAmount: tournament.winningAmount,
                        playerNumber: tournament.playerNumber,
                        value: time.value,
                        metric: time.metric,
                        joined: tournament.accepted != null ? tournament.accepted.length : 0,
                    };
                    
                    tournamentNotificationArray.push(notification);
                }
            }

            const notificationArray = challengeNotificationArray.concat(tournamentNotificationArray);
            response.code = 0;
            response.msg = "This profile has been found.";
            response.idName = userAccount.idName;
            response.firstName = userAccount.firstName;
            response.otherName = userAccount.otherName;
            response.lastName = userAccount.lastName;
            response.about = userAccount.about;
            response.profilePic = userAccount.profilePic ? userAccount.profilePic.toString('hex') : null;
            response.followers = userAccount.followers.length;
            response.following = userAccount.following.length;
            response.level = userAccount.rank;
            response.isFollowing = userAccount.followers.indexOf(rUsername) == -1 ? false : true;
            response.joinedValue = time.value;
            response.joinedMetric = time.metric;
            response.chart = chartValue;
            response.notifications = notificationArray;

            res.send(response);
        } else {
            response.code = 1;
            response.msg = "Profile couldn't be found.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

async function followProfile(req, res) {
    var response = {}
    const {rUsername, rPassword, rProfile} = req.body;
    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const userProfile = await Account.findOne({username: rProfile});
                    if (userProfile) {
                        if (userProfile.followers.indexOf(rUsername) == -1) {
                            await Account.findOneAndUpdate(
                                {username: rProfile},
                                {$push: {followers: rUsername}},
                                {new: true}
                            );
                            await Account.findOneAndUpdate(
                                {username: rUsername},
                                {$push: {following: rProfile}},
                                {new: true}
                            );
                            response.code = 0;
                            response.msg = "You followed " + rProfile.idName + "!";
                            res.send(response);
                        } else {
                            await Account.findOneAndUpdate(
                                {username: rProfile},
                                {$pull: {followers: rUsername}},
                                {new: true}
                            );
                            await Account.findOneAndUpdate(
                                {username: rUsername},
                                {$pull: {following: rProfile}},
                                {new: true}
                            );
                            response.code = 1;
                            response.msg = "You unfollowed " + rProfile.idName + ".";
                            res.send(response);
                        }
                    } else {
                        response.code = 2;
                        response.msg = "This account could not be found.";
                        res.send(response);
                    }
                } else {
                    response.code = 3;
                    response.msg = "Log in again, something seems fishy.";
                    res.send(response);
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

async function getProfilePic(req, res) {
    var response = {}
    const {rUsername} = req.params;

    try {
        const userAccount = await Account.findOne({username: rProfile});
        if (userAccount != null) {
            response.code = 0;
            response.profilePic = userAccount.profilePic ? userAccount.profilePic.toString('hex') : null;
            res.send(response);
        } else {
            response.code = 1;
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getProfile: getProfile,
    followProfile: followProfile,
    getProfilePic: getProfilePic
}