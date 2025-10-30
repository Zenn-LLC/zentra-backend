require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Room.js');
const Room = mongoose.model('rooms');

require('./model/WhotLobby.js');
const WhotLobby = mongoose.model('whotLobbys');

require('./model/LudoLobby.js');
const LudoLobby = mongoose.model('ludoLobbys');

require('./model/PoolLobby.js');
const PoolLobby = mongoose.model('poolLobbys');

require('./model/Account.js');
const Account = mongoose.model('accounts');

async function joinRoom(req, res) {
    var response = {}
    const {rUsername, rPassword, rRoomID} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const userRoom = await Room.findOne({roomID: rRoomID});
                    if (userRoom) {
                        const iden = {
                            player: rUsername,
                            ready: false,
                            arrive: false
                        }
                        await Room.findOneAndUpdate(
                            {roomID: rRoomID},
                            {$push: {players: iden}},
                            {new: true}
                        );


                        const newRoom = await Room.findOne({roomID: rRoomID});

                        response.data = newRoom.players;
                        response.date = Date.now().toString();
                        res.send(response);
                    } else {
                        response.code = 1;
                        response.msg = "??????";
                        res.send(response);
                    }
                } else {
                    response.code = 2;
                    response.msg = "Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 2;
            response.msg = "Error, log into your account.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

async function leaveRoom(req, res) {
    var response = {}
    const {rUsername, rPassword, rRoomID} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    const userRoom = await Room.findOne({roomID: rRoomID});
                    if (userRoom) {
                        await Room.findOneAndUpdate(
                            {roomID: rRoomID},
                            {$pull: {players: {player: rUsername}}},
                            {new: true}
                        )

                        response.code = 0;
                        response.msg = "Leaving.";
                        res.send(response);
                    } else {
                        response.code = 1;
                        response.msg = "??????";
                        res.send(response);
                    }
                } else {
                    response.code = 2;
                    response.msg = "Log into your account.";
                    res.send(response);
                }
            });
        } else {
            response.code = 2;
            response.msg = "Error, log into your account.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

async function getRoomInfo(req, res) {
    // Enable SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    Room.watch().on('change', async (change) => {
        const theRoom = await Room.findOne({_id: change.documentKey._id});
        if (theRoom.roomID == req.params.roomStore) {
            const matchingObject = theRoom.players.find(obj => obj['ready'] === false);
            if (matchingObject || theRoom.players.length < parseInt(2**theRoom.finalInt)) {
                res.write(JSON.stringify({data: theRoom.players, date: Date.now().toString(), ready: theRoom.ready, lobby: null, game: theRoom.game}) + '\n\n');
            } else {
                const playerObject = theRoom.players.find(obj => obj['player'] === req.params.username);
                var index = Math.floor(theRoom.players.indexOf(playerObject)/2);
                res.write(JSON.stringify({data: theRoom.players, date: Date.now().toString(), ready: theRoom.ready, lobby: theRoom.lobbyID[index], game: theRoom.game}) + '\n\n');
            }
        }
    });

    // Close the connection when the client disconnects
    req.on('close', async () => {
        try {
            res.end();
        } catch (error) {
            console.log("Disconnection error");
            res.end();
        }
    });
}

async function toggleReady(req, res) {
    var response = {}

    try {
        const {rUsername, rPassword, rRoomID, rIsReady} = req.body;
        var userAccount = await Account.findOne({username: rUsername});
        if (userAccount) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    var userRoom = await Room.findOne({roomID: rRoomID});
                    if (userRoom) {
                        var matchingObject = userRoom.players.find(obj => obj['player'] === rUsername);
                        if (matchingObject) {
                            if (rIsReady == 0) {
                                await Room.findOneAndUpdate(
                                    {roomID: rRoomID, 'players.player': matchingObject.player},
                                    {$set: {'players.$.ready': true}},
                                    {new: true}
                                );
                                const theRoom = await Room.findOne({roomID: rRoomID});
                                const findFalse = theRoom.players.find(obj => obj['ready'] === false);
                                if (!findFalse && 2**theRoom.finalInt == theRoom.players.length) {
                                    if (theRoom.game == "Whots") {
                                        for (var i = 0; i < (2**theRoom.finalInt)/2; i++) {
                                            // Creating a new Whots lobby
                                            const whotStack = await require('./generate-whot-stack.js').generateStack();
                                            const user1 = theRoom.players[(2*i)+0].player;
                                            const user1stack = await require('./generate-whot-stack.js').generatePlayerStack(whotStack);
                                            const user2 = theRoom.players[(2*i)+1].player;
                                            const user2stack = await require('./generate-whot-stack.js').generatePlayerStack(whotStack);
                                            const move = {
                                                player: user2,
                                                card: {
                                                    shape: "Square",
                                                    number: 3,
                                                    cardID: "fuckLife",
                                                }
                                            }
                
                                            await WhotLobby.findOneAndUpdate(
                                                {lobbyID: theRoom.lobbyID[i]},
                                                {
                                                    stack: whotStack,
                                                    player1: user1,
                                                    player1_stack: user1stack,
                                                    player2: user2,
                                                    player2_stack: user2stack,
                                                    moves: [move],
                                                    winner: null,
                                                    finals: theRoom.finalInt
                                                },
                                                {new: true}
                                            );
                                        }
                                    } else if (theRoom.game == 'Ludo') {
                                        for (var i = 0; i < (2**theRoom.finalInt)/2; i++) {
                                            // Creating a new Ludo lobby
                                            const user1 = theRoom.players[(2*i)+0].player;
                                            const player1Token_1 = await require('./ludo-generate-tokens.js').generateTokenArray('Red');
                                            const player1Token_2 = await require('./ludo-generate-tokens.js').generateTokenArray('Blue');
                                            const user2 = theRoom.players[(2*i)+1].player;
                                            const player2Token_1 = await require('./ludo-generate-tokens.js').generateTokenArray('Green');
                                            const player2Token_2 = await require('./ludo-generate-tokens.js').generateTokenArray('Yellow');
                                            await LudoLobby.findOneAndUpdate(
                                                {lobbyID: theRoom.lobbyID[i]},
                                                {
                                                    player1: user1,
                                                    red: player1Token_1,
                                                    blue: player1Token_2,
                                                    player2: user2,
                                                    green: player2Token_1,
                                                    yellow: player2Token_2,
                                                    lastPlayer: user2,
                                                    moves: [{
                                                        player: user2,
                                                        dice: [0, 0],
                                                        move_1: false,
                                                        move_2: false
                                                    }],
                                                    diceRoll: false,
                                                    winner: null,
                                                    finals: theRoom.finalInt
                                                },
                                                {new: true}
                                            );
                                        }
                                    } else if (theRoom.game == 'Pool') {
                                        for (var i = 0; i < (2**theRoom.finalInt)/2; i++) {
                                            // Creating a new Pool lobby
                                            const user1 = theRoom.players[(2*i)+0].player;
                                            const user2 = theRoom.players[(2*i)+1].player;
                                            await PoolLobby.findOneAndUpdate(
                                                {lobbyID: theRoom.lobbyID[i]},
                                                {
                                                    player1: user1,
                                                    player2: user2,
                                                    player1_ball: null,
                                                    player2_ball: null,
                                                    lastPlayer: user2,
                                                    balls: [],
                                                    pottedWhite: {
                                                        potted: false,
                                                        player: null
                                                    },
                                                    winner: null,
                                                    finals: theRoom.finalInt
                                                },
                                                {new: true}
                                            );
                                        }
                                    }

                                    await Room.findOneAndUpdate(
                                        {roomID: rRoomID},
                                        {
                                            finalInt: theRoom.finalInt-1,
                                            ready: true
                                        },
                                        {new: true}
                                    );
                                }
                            } else if (rIsReady == 1) {
                                await Room.findOneAndUpdate(
                                    {roomID: rRoomID, 'players.player': matchingObject.player},
                                    {$set: {'players.$.ready': false}},
                                    {new: true}
                                );
                            }
                        }
                        res.send(response);
                    } else {
                        response.code = 1;
                        response.msg = "??????";
                        res.send(response);
                    }
                } else {
                    response.code = 2;
                    response.msg = "Error, log into your account";
                    res.send(response);
                }
            });
        } else {
            response.code = 2;
            response.msg = "Error, log into your account.";
            res.send(response);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    joinRoom: joinRoom,
    leaveRoom: leaveRoom,
    getRoomInfo: getRoomInfo,
    toggleReady: toggleReady
}