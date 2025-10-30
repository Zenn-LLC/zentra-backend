require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const joinWhotsLobby = require('./join-whots-lobby.js');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/PoolLobby.js');
const PoolLobby = mongoose.model('poolLobbys');

require('./model/Account.js');
const Account = mongoose.model('accounts');

require('./model/Room.js');
const Room = mongoose.model('rooms');

async function startLobby(req, res) {
    const {rUsername, rLobbyID} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        const theLobby = await PoolLobby.findOne({lobbyID: rLobbyID});
        if (userAccount) {
            if (theLobby) {
                const updateRoom = await Room.findOneAndUpdate(
                    {roomID: theLobby.roomID, 'players.player': rUsername},
                    {$set: {'players.$.arrive': true}},
                    {new: true}
                );
                const matchingObject = updateRoom.players.find(obj => obj['arrive'] === false);
                if (!matchingObject) {
                    await Room.findOneAndUpdate(
                        {roomID: theLobby.roomID},
                        {players: [], ready: false},
                        {new: true}
                    );
                }

                const firstAccount = await Account.findOne({username: theLobby.player1});
                const secondAccount = await Account.findOne({username: theLobby.player2});

                const moveJSON = {
                    lastPlayer: theLobby.lastPlayer,
                    player1: theLobby.player1,
                    player1_type: theLobby.player1_ball,
                    player1_idName: firstAccount.idName,
                    player1_profile: firstAccount.profilePic.toString('hex'),
                    player2: theLobby.player2,
                    player2_type: theLobby.player2_ball,
                    player2_idName: secondAccount.idName,
                    player2_profile: secondAccount.profilePic.toString('hex'),
                    date: Date.now().toString()
                }
                res.send(JSON.stringify(moveJSON));
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function joinLobby(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    PoolLobby.watch().on('change', async (change) => {
        const theLobby = await PoolLobby.findOne({_id: change.documentKey._id});
        if (theLobby.lobbyID == req.params.lobbyID) {
            var moveJSON = {
                lastPlayer: theLobby.lastPlayer,
                player1: theLobby.player1,
                player1_type: theLobby.player1_ball,
                player2: theLobby.player2,
                player2_type: theLobby.player2_ball,
                balls: theLobby.balls,
                winner: theLobby.winner,
                finals: theLobby.finals,
                pottedWhitePlayer: theLobby.pottedWhite.player,
                pottedWhitePotted: theLobby.pottedWhite.potted,
                date: Date.now().toString()
            };
            res.write(JSON.stringify(moveJSON) + '\n\n');
        }
    });

    // Close the connection when the client disconnects
    req.on('close', async () => {
        res.end();
    });
}

async function makeMove(req, res) {
    const {rUsername, rLobbyID, rData, rPotted} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        const theLobby = await PoolLobby.findOne({lobbyID: rLobbyID});
        if (userAccount) {
            if (theLobby) {
                await PoolLobby.findOneAndUpdate(
                    {lobbyID: rLobbyID},
                    {
                        lastPlayer: rUsername,
                        balls: JSON.parse(rData).array
                    },
                    {new: true}
                );

                const updatedLobby = await PoolLobby.findOne({lobbyID: rLobbyID});


                var stringArray = rPotted.split(",");
                var intArray = [];
                for (var i = 0; i < stringArray.length; i++) {
                    intArray.push(parseInt(stringArray[i]));
                }

                if (rUsername == updatedLobby.player1) {
                    if (updatedLobby.player1_ball == null && updatedLobby.player2_ball == null) {
                        if (intArray.length == 1) {
                            if (intArray[0] >= 1 && intArray[0] < 8) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Red',
                                        player2_ball: 'Yellow'
                                    },
                                    {new: true}
                                );
                            } else if (intArray[0] <= 15 && intArray[0] > 8) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Yellow',
                                        player2_ball: 'Red'
                                    },
                                    {new: true}
                                );
                            }
                        } else if (intArray.length != 0 && intArray.length != 1) {
                            if (intArray.every(num => num >= 1) && intArray.every(num => num < 8)) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Red',
                                        player2_ball: 'Yellow'
                                    },
                                    {new: true}
                                );
                            } else if (intArray.every(num => num <= 15) && intArray.every(num => num > 8)) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Yellow',
                                        player2_ball: 'Red'
                                    },
                                    {new: true}
                                );
                            }
                        }
                    }
                    // Check if all but eight has been potted
                    var allButEight = true;
                    if (updatedLobby.player1_ball == "Red") {
                        for (var i = 0; i <= 6; i++) {
                            if (updatedLobby.balls[i].ball_potted == false) {
                                allButEight = false;
                                break;
                            }
                        }
                    } else if (updatedLobby.player1_ball == "Yellow") {
                        for (var i = 8; i <= 14; i++) {
                            if (updatedLobby.balls[i].ball_potted == false) {
                                allButEight = false;
                                break;
                            }
                        }
                    } else {
                        allButEight = false;
                    }

                    if (allButEight == true && intArray.indexOf(8) >= 0) {
                        await PoolLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player1}, {new: true});
                    } else if (allButEight == false && intArray.indexOf(8) >= 0) {
                        await PoolLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player2}, {new: true});
                    }

                    if (intArray.indexOf(16) >= 0) {
                        await PoolLobby.findOneAndUpdate(
                            {lobbyID: rLobbyID},
                            {
                                pottedWhite: {
                                    potted: true,
                                    player: rUsername,
                                }
                            },
                            {new: true}
                        );
                    } else {
                        await PoolLobby.findOneAndUpdate(
                            {lobbyID: rLobbyID},
                            {
                                pottedWhite: {
                                    potted: false,
                                    player: null,
                                }
                            },
                            {new: true}
                        );
                    }
                } else if (rUsername == updatedLobby.player2) {
                    if (updatedLobby.player1_ball == null && updatedLobby.player2_ball == null) {
                        if (intArray.length == 1) {
                            if (intArray[0] >= 1 && intArray[0] < 8) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Yellow',
                                        player2_ball: 'Red'
                                    },
                                    {new: true}
                                );
                            } else if (intArray[0] <= 15 && intArray[0] > 8) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Red',
                                        player2_ball: 'Yellow'
                                    },
                                    {new: true}
                                );
                            }
                        } else if (intArray.length != 0 && intArray.length != 1) {
                            if (intArray.every(num => num >= 1) && intArray.every(num => num < 8)) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Yellow',
                                        player2_ball: 'Red'
                                    },
                                    {new: true}
                                );
                            } else if (intArray.every(num => num <= 15) && intArray.every(num => num > 8)) {
                                await PoolLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        player1_ball: 'Red',
                                        player2_ball: 'Yellow'
                                    },
                                    {new: true}
                                );
                            }
                        }
                    }
                    // Check if all but eight has been potted
                    var allButEight = true;
                    if (updatedLobby.player2_ball == "Red") {
                        for (var i = 0; i <= 6; i++) {
                            if (updatedLobby.balls[i].ball_potted == false) {
                                allButEight = false;
                                break;
                            }
                        }
                    } else if (updatedLobby.player2_ball == "Yellow") {
                        for (var i = 8; i <= 14; i++) {
                            if (updatedLobby.balls[i].ball_potted == false) {
                                allButEight = false;
                                break;
                            }
                        }
                    } else {
                        allButEight = false;
                    }

                    if (allButEight == true && intArray.indexOf(8) >= 0) {
                        await PoolLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player2}, {new: true});
                    } else if (allButEight == false && intArray.indexOf(8) >= 0) {
                        await PoolLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player1}, {new: true});
                    }

                    if (intArray.indexOf(16) >= 0) {
                        await PoolLobby.findOneAndUpdate(
                            {lobbyID: rLobbyID},
                            {
                                pottedWhite: {
                                    potted: true,
                                    player: rUsername,
                                }
                            },
                            {new: true}
                        );
                    } else {
                        await PoolLobby.findOneAndUpdate(
                            {lobbyID: rLobbyID},
                            {
                                pottedWhite: {
                                    potted: false,
                                    player: null,
                                }
                            },
                            {new: true}
                        );
                    }
                }

                res.send();
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function refreshLobby(req, res) {
    const {rLobbyID} = req.body;

    try {
        const theLobby = await PoolLobby.findOne({lobbyID: rLobbyID});
        if (theLobby) {
            const num = theLobby.refreshed + 1;
            await PoolLobby.findOneAndUpdate(
                {lobbyID: rLobbyID},
                {refreshed: num},
                {new: true}
            );
        }
    } catch (error) {
        console.log(error);
    }
}

async function completeTransaction(req, res) {
    const {rLobbyID} = req.body;
    
    try {
        const updatedLobby = await PoolLobby.findOne({lobbyID: rLobbyID});
        if (updatedLobby.paid == false) {
            await PoolLobby.findOneAndUpdate(
                {lobbyID: rLobbyID},
                {paid: true},
                {new: true}
            );
            if (updatedLobby.winner == updatedLobby.player1) {
                if (updatedLobby.finals == 1) {
                    const updatedAccount = await Account.findOne({username: updatedLobby.player1});
                    const money = updatedAccount.funds + updatedLobby.money;
                
                    await Account.findOneAndUpdate(
                        {username: updatedLobby.player1},
                        {
                            funds: money,
                            $push: {
                                gameTransact: {
                                    win: true,
                                    game: "Pool",
                                    challenge: true,
                                    amountInvolved: updatedLobby.money,
                                    date: Date.now().toString()
                                },
                                moneyTransact: {
                                    credit: true,
                                    game: true,
                                    theGame: "Pool",
                                    amount: updatedLobby.money,
                                    date: Date.now().toString(),
                                }
                            },
                            $pull: {
                                pendingGames: updatedLobby.roomID
                            }
                        },
                        {new: true}
                    );
                }
                await Account.findOneAndUpdate(
                    {username: updatedLobby.player2},
                    {
                        $push: {
                            gameTransact: {
                                win: false,
                                game: "Pool",
                                challenge: true,
                                amountInvolved: updatedLobby.money,
                                date: Date.now().toString()
                            },
                        },
                        $pull: {
                            pendingGames: updatedLobby.roomID
                        }
                    },
                    {new: true}
                );
            } else if (updatedLobby.winner == updatedLobby.player2) {
                if (updatedLobby.finals == 1) {
                    const updatedAccount = await Account.findOne({username: updatedLobby.player2});
                    const money = updatedAccount.funds + updatedLobby.money;
                    await Account.findOneAndUpdate(
                        {username: updatedLobby.player2},
                        {
                            funds: money,
                            $push: {
                                gameTransact: {
                                    win: true,
                                    game: "Pool",
                                    challenge: true,
                                    amountInvolved: updatedLobby.money,
                                    date: Date.now().toString()
                                },
                                moneyTransact: {
                                    credit: true,
                                    game: true,
                                    theGame: "Pool",
                                    amount: updatedLobby.money,
                                    date: Date.now().toString(),
                                }
                            },
                            $pull: {
                                pendingGames: updatedLobby.roomID
                            }
                        },
                        {new: true}
                    );
                }
                await Account.findOneAndUpdate(
                    {username: updatedLobby.player1},
                    {
                        $push: {
                            gameTransact: {
                                win: false,
                                game: "Pool",
                                challenge: true,
                                amountInvolved: updatedLobby.money,
                                date: Date.now().toString()
                            },
                        },
                        $pull: {
                            pendingGames: updatedLobby.roomID
                        }
                    },
                    {new: true}
                );
            }

        }
        res.send("Hmm.");
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    startLobby: startLobby,
    joinLobby: joinLobby,
    makeMove: makeMove,
    refreshLobby: refreshLobby,
    completeTransaction: completeTransaction
}