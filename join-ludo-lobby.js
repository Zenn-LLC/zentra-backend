require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/LudoLobby.js');
const LudoLobby = mongoose.model('ludoLobbys');

require('./model/Account.js');
const Account = mongoose.model('accounts');

require('./model/Room.js');
const Room = mongoose.model('rooms');

async function joinLobby(req, res) {
    // Enable SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    LudoLobby.watch().on('change', async (change) => {
        const theLobby = await LudoLobby.findOne({_id: change.documentKey._id});
        if (theLobby.lobbyID == req.params.lobbyID) {
            var moveJSON;
            if (req.params.user == theLobby.moves[theLobby.moves.length-1].player) {
                moveJSON = {
                    code: null,
                    msg: "Nice roll!",
                    x: theLobby.moves[theLobby.moves.length-1].dice[0],
                    y: theLobby.moves[theLobby.moves.length-1].dice[1],
                    roll: theLobby.diceRoll,

                    tokens: theLobby.red.concat(theLobby.blue, theLobby.green, theLobby.yellow),
                    winner: theLobby.winner,
                    finals: theLobby.finals,
    
                    date: Date.now().toString()
                }
            } else {
                moveJSON = {
                    code: null,
                    msg: "A roll from opponent!",
                    x: theLobby.moves[theLobby.moves.length-1].dice[0],
                    y: theLobby.moves[theLobby.moves.length-1].dice[1],
                    roll: theLobby.diceRoll,

                    tokens: theLobby.red.concat(theLobby.blue, theLobby.green, theLobby.yellow),
                    winner: theLobby.winner,
                    finals: theLobby.finals,
    
                    date: Date.now().toString()
                }
            }
            res.write(JSON.stringify(moveJSON) + '\n\n');
        }
    });

    // Close the connection when the client disconnects
    req.on('close', async () => {
        res.end();
    });
}

async function startLobby(req, res) {
    const {rUsername, rLobbyID} = req.body;
    const theLobby = await LudoLobby.findOne({lobbyID: rLobbyID});
    const userAccount = await Account.findOne({username: rUsername});
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

            
            if (rUsername == theLobby.player1) {
                const moveJSON = {
                    player1: theLobby.player1,
                    player1_type: theLobby.player1_ball,
                    player1_idName: firstAccount.idName,
                    player1_profile: firstAccount.profilePic.toString('hex'),
                    player2: theLobby.player2,
                    player2_type: theLobby.player2_ball,
                    player2_idName: secondAccount.idName,
                    player2_profile: secondAccount.profilePic.toString('hex'),

                    playerToken: theLobby.red.concat(theLobby.blue, theLobby.green, theLobby.yellow),
                    stacks: ["Red", "Blue"],
                    
                    date: Date.now().toString()
                }
                res.send(JSON.stringify(moveJSON));
            } else if (rUsername == theLobby.player2) {
                const moveJSON = {
                    player1: theLobby.player1,
                    player1_type: theLobby.player1_ball,
                    player1_idName: firstAccount.idName,
                    player1_profile: firstAccount.profilePic.toString('hex'),
                    player2: theLobby.player2,
                    player2_type: theLobby.player2_ball,
                    player2_idName: secondAccount.idName,
                    player2_profile: secondAccount.profilePic.toString('hex'),

                    playerToken: theLobby.red.concat(theLobby.blue, theLobby.green, theLobby.yellow),
                    stacks: ["Green", "Yellow"],
                    
                    date: Date.now().toString()
                }
                res.send(JSON.stringify(moveJSON));
            }
        }
    }
}

async function rollDice(req, res) {
    const {rUsername, rLobbyID} = req.body;
    const theLobby = await LudoLobby.findOne({lobbyID: rLobbyID});
    const userAccount = await Account.findOne({username: rUsername});
    if (userAccount) {
        if (theLobby) {
            var lastPlayer = theLobby.lastPlayer;
            var lastMove = theLobby.moves[theLobby.moves.length-1];
            if (lastPlayer != rUsername) {
                if (lastMove.player != rUsername) {
                    const xDice = Math.floor(Math.random() * 6) + 1;
                    const yDice = Math.floor(Math.random() * 6) + 1;
    
                    await LudoLobby.findOneAndUpdate(
                        {lobbyID: rLobbyID},
                        {$push: {moves: {
                            player: rUsername,
                            dice: [xDice, yDice],
                            move_1: false,
                            move_2: false,
                            date: Date.now().toString()
                        }}, diceRoll: true},
                        {new: true}
                    );

                    if (rUsername == theLobby.player1) {
                        // Combine the two tokens arrays for a player
                        const tokes = theLobby.red.concat(theLobby.blue);
                        var play = false;
                        // Check if any of the token are still at the beginning or end
                        for (var i = 0; i < tokes.length; i++) {
                            if (tokes[i].step != 0 && tokes[i].step != 57) {
                                play = true;
                            }
                        }
                        // If all the tokens are still at the beginning or end...
                        if (play == false) {
                            // If you didn't play a six
                            if (xDice != 6 && yDice != 6) {
                                await LudoLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {lastPlayer: rUsername},
                                    {new: true}
                                );
                            }
                        }
                    } else if (rUsername == theLobby.player2) {
                        // Combine the two tokens arrays for a player
                        const tokes = theLobby.green.concat(theLobby.yellow);
                        var play = false;
                        // Check if any of the token are still at the begining
                        for (var i = 0; i < tokes.length; i++) {
                            if (tokes[i].step != 0 && tokes[i].step != 57) {
                                play = true;
                            }
                        }
                        // If all the tokens are still at the beginning...
                        if (play == false) {
                            // If you didn't play a six
                            if (xDice != 6 && yDice != 6) {
                                await LudoLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {lastPlayer: rUsername},
                                    {new: true}
                                );
                            }
                        }
                    }
    
                    res.send({code: 0, msg: "Nice roll!", x: xDice, y: yDice, date: Date.now().toString()});
                } else {
                    res.send({code: 1, msg: "It's not your turn to roll the dice.", x: null, y: null, date: Date.now().toString()});
                }
            } else if (lastPlayer == rUsername) {
                res.send({code: 1, msg: "It's not your turn to roll the dice.", x: null, y: null, date: Date.now().toString()});
            }
        } else {
            console.log("Lobby no dey.");
            res.send("Ooo");
        }
    } else {
        console.log("Account sef no dey.");
        res.send("Ooo");
    }
}

async function makeMove(req, res) {
    const {rUsername, rLobbyID, rColor, rOrdinal, rDie} = req.body;
    const theLobby = await LudoLobby.findOne({lobbyID: rLobbyID});
    const userAccount = await Account.findOne({username: rUsername});

    await LudoLobby.findOneAndUpdate(
        {lobbyID: rLobbyID},
        {diceRoll: false},
        {new: true}
    );

    if (userAccount) {
        if (theLobby) {
            if (rColor == "Red") {
                var lastPlayer = theLobby.lastPlayer;
                var lastMove = theLobby.moves[theLobby.moves.length-1];
                if (lastPlayer != rUsername) {
                    if (lastMove.player == rUsername) {
                        var matchingToken = theLobby.red.find(obj => obj['ordinal'] === parseInt(rOrdinal));
                        if (matchingToken) {
                            if (parseInt(matchingToken.step) != 0 && parseInt(matchingToken.step) + parseInt(rDie) <= 57) {
                                // Calculate the future steps
                                var steps = parseInt(matchingToken.step) + parseInt(rDie);

                                // Get the enemy tokens
                                const hello = theLobby.yellow.concat(theLobby.green);

                                // Get the enemy token's transform
                                const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, steps);

                                // Filter the tokens that are in the way of the moving token
                                var enemyTokens = [];
                                for (var i = 0; i < hello.length; i++) {
                                    const vColor = hello[i].color;
                                    const vOrdinal = hello[i].ordinal;
                                    const vStep = hello[i].step;
                                    var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                    if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1]) && steps < 57) {
                                        enemyTokens.push(hello[i]);
                                    }
                                }

                                // Handle found token in area
                                if (enemyTokens.length == 0) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'red.ordinal': rOrdinal},
                                        {$set: {'red.$.step': steps}},
                                        {new: true}
                                    );
                                } else {
                                    var bulkOps = [];
                                    for (var i = 0; i < enemyTokens.length; i++) {
                                        if (enemyTokens[i].color == "Yellow") {
                                            var filter = {lobbyID: rLobbyID, 'yellow.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'yellow.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        } else if (enemyTokens[i].color == "Green") {
                                            var filter = {lobbyID: rLobbyID, 'green.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'green.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        }
                                    }
                                    await LudoLobby.bulkWrite(bulkOps);
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'red.ordinal': rOrdinal},
                                        {$set: {'red.$.step': 57}},
                                        {new: true}
                                    );
                                }

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) + parseInt(rDie) > 57) {
                                await LudoLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID, 'red.ordinal': rOrdinal},
                                    {$set: {'red.$.step': 57}},
                                    {new: true}
                                );

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) == 0) {
                                if (parseInt(rDie) == 6) {
                                    const hello = theLobby.yellow.concat(theLobby.green);
                                    const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, 1);
                                    var enemyTokens = [];
                                    for (var i = 0; i < hello.length; i++) {
                                        const vColor = hello[i].color;
                                        const vOrdinal = hello[i].ordinal;
                                        const vStep = hello[i].step;
                                        var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                        if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1])) {
                                            enemyTokens.push(hello[i]);
                                        }
                                    }

                                    if (enemyTokens.length == 0) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'red.ordinal': rOrdinal},
                                            {$set: {'red.$.step': 1}},
                                            {new: true}
                                        );
                                    } else {
                                        var bulkOps = [];
                                        for (var i = 0; i < enemyTokens.length; i++) {
                                            if (enemyTokens[i].color == "Yellow") {
                                                var filter = {lobbyID: rLobbyID, 'yellow.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'yellow.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            } else if (enemyTokens[i].color == "Green") {
                                                var filter = {lobbyID: rLobbyID, 'green.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'green.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            }
                                        }
                                        await LudoLobby.bulkWrite(bulkOps);
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'red.ordinal': rOrdinal},
                                            {$set: {'red.$.step': 57}},
                                            {new: true}
                                        );
                                    }

                                    if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_1': true}},
                                            {new: true}
                                        );
                                    } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_2': true}},
                                            {new: true}
                                        );
                                        if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                            await LudoLobby.findOneAndUpdate(
                                                {lobbyID: rLobbyID},
                                                {lastPlayer: rUsername},
                                                {new: true}
                                            );
                                        }
                                    }
                                }
                            }
                        }
                        res.send();
                    } else {
                        res.send("It\'s not your turn.");
                    }
                } else {
                    res.send("It\'s not your turn no more.");
                }
            } else if (rColor == "Yellow") {
                var lastPlayer = theLobby.lastPlayer;
                var lastMove = theLobby.moves[theLobby.moves.length-1];
                if (lastPlayer != rUsername) {
                    if (lastMove.player == rUsername) {
                        var matchingToken = theLobby.yellow.find(obj => obj['ordinal'] === parseInt(rOrdinal));
                        if (matchingToken) {
                            if (parseInt(matchingToken.step) != 0 && parseInt(matchingToken.step) + parseInt(rDie) <= 57) {
                                // Calculate the future steps
                                var steps = parseInt(matchingToken.step) + parseInt(rDie);

                                // Get the enemy tokens
                                const hello = theLobby.red.concat(theLobby.blue);

                                // Get the enemy token's transform
                                const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, steps);

                                // Filter the tokens that are in the way of the moving token
                                var enemyTokens = [];
                                for (var i = 0; i < hello.length; i++) {
                                    const vColor = hello[i].color;
                                    const vOrdinal = hello[i].ordinal;
                                    const vStep = hello[i].step;
                                    var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                    if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1]) && steps < 57) {
                                        enemyTokens.push(hello[i]);
                                    }
                                }

                                // Handle found token in area
                                if (enemyTokens.length == 0) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'yellow.ordinal': rOrdinal},
                                        {$set: {'yellow.$.step': steps}},
                                        {new: true}
                                    );
                                } else {
                                    var bulkOps = [];
                                    for (var i = 0; i < enemyTokens.length; i++) {
                                        if (enemyTokens[i].color == "Red") {
                                            var filter = {lobbyID: rLobbyID, 'red.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'red.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        } else if (enemyTokens[i].color == "Blue") {
                                            var filter = {lobbyID: rLobbyID, 'blue.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'blue.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        }
                                    }
                                    await LudoLobby.bulkWrite(bulkOps);
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'yellow.ordinal': rOrdinal},
                                        {$set: {'yellow.$.step': 57}},
                                        {new: true}
                                    );
                                }

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) + parseInt(rDie) > 57) {
                                await LudoLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID, 'yellow.ordinal': rOrdinal},
                                    {$set: {'yellow.$.step': 57}},
                                    {new: true}
                                );

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) == 0) {
                                if (parseInt(rDie) == 6) {
                                    const hello = theLobby.yellow.concat(theLobby.yellow);
                                    const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, 1);
                                    var enemyTokens = [];
                                    for (var i = 0; i < hello.length; i++) {
                                        const vColor = hello[i].color;
                                        const vOrdinal = hello[i].ordinal;
                                        const vStep = hello[i].step;
                                        var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                        if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1])) {
                                            enemyTokens.push(hello[i]);
                                        }
                                    }

                                    if (enemyTokens.length == 0) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'yellow.ordinal': rOrdinal},
                                            {$set: {'yellow.$.step': 1}},
                                            {new: true}
                                        );
                                    } else {
                                        var bulkOps = [];
                                        for (var i = 0; i < enemyTokens.length; i++) {
                                            if (enemyTokens[i].color == "Red") {
                                                var filter = {lobbyID: rLobbyID, 'red.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'red.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            } else if (enemyTokens[i].color == "Blue") {
                                                var filter = {lobbyID: rLobbyID, 'blue.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'blue.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            }
                                        }
                                        await LudoLobby.bulkWrite(bulkOps);
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'yellow.ordinal': rOrdinal},
                                            {$set: {'yellow.$.step': 57}},
                                            {new: true}
                                        );
                                    }

                                    if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_1': true}},
                                            {new: true}
                                        );
                                    } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_2': true}},
                                            {new: true}
                                        );
                                        if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                            await LudoLobby.findOneAndUpdate(
                                                {lobbyID: rLobbyID},
                                                {lastPlayer: rUsername},
                                                {new: true}
                                            );
                                        }
                                    }
                                }
                            }
                        }
                        res.send();
                    } else {
                        res.send("It\'s not your turn.");
                    }
                } else {
                    res.send("It\'s not your turn no more.");
                }
            } else if (rColor == "Green") {
                var lastPlayer = theLobby.lastPlayer;
                var lastMove = theLobby.moves[theLobby.moves.length-1];
                if (lastPlayer != rUsername) {
                    if (lastMove.player == rUsername) {
                        var matchingToken = theLobby.green.find(obj => obj['ordinal'] === parseInt(rOrdinal));
                        if (matchingToken) {
                            if (parseInt(matchingToken.step) != 0 && parseInt(matchingToken.step) + parseInt(rDie) <= 57) {
                                // Calculate the future steps
                                var steps = parseInt(matchingToken.step) + parseInt(rDie);

                                // Get the enemy tokens
                                const hello = theLobby.red.concat(theLobby.blue);

                                // Get the enemy token's transform
                                const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, steps);

                                // Filter the tokens that are in the way of the moving token
                                var enemyTokens = [];
                                for (var i = 0; i < hello.length; i++) {
                                    const vColor = hello[i].color;
                                    const vOrdinal = hello[i].ordinal;
                                    const vStep = hello[i].step;
                                    var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                    if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1]) && steps < 57) {
                                        enemyTokens.push(hello[i]);
                                    }
                                }

                                // Handle found token in area
                                if (enemyTokens.length == 0) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'green.ordinal': rOrdinal},
                                        {$set: {'green.$.step': steps}},
                                        {new: true}
                                    );
                                } else {
                                    var bulkOps = [];
                                    for (var i = 0; i < enemyTokens.length; i++) {
                                        if (enemyTokens[i].color == "Red") {
                                            var filter = {lobbyID: rLobbyID, 'red.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'red.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        } else if (enemyTokens[i].color == "Blue") {
                                            var filter = {lobbyID: rLobbyID, 'blue.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'blue.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        }
                                    }
                                    await LudoLobby.bulkWrite(bulkOps);
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'green.ordinal': rOrdinal},
                                        {$set: {'green.$.step': 57}},
                                        {new: true}
                                    );
                                }

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) + parseInt(rDie) > 57) {
                                await LudoLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID, 'green.ordinal': rOrdinal},
                                    {$set: {'green.$.step': 57}},
                                    {new: true}
                                );

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) == 0) {
                                if (parseInt(rDie) == 6) {
                                    const hello = theLobby.yellow.concat(theLobby.green);
                                    const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, 1);
                                    var enemyTokens = [];
                                    for (var i = 0; i < hello.length; i++) {
                                        const vColor = hello[i].color;
                                        const vOrdinal = hello[i].ordinal;
                                        const vStep = hello[i].step;
                                        var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                        if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1])) {
                                            enemyTokens.push(hello[i]);
                                        }
                                    }

                                    if (enemyTokens.length == 0) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'green.ordinal': rOrdinal},
                                            {$set: {'green.$.step': 1}},
                                            {new: true}
                                        );
                                    } else {
                                        var bulkOps = [];
                                        for (var i = 0; i < enemyTokens.length; i++) {
                                            if (enemyTokens[i].color == "Red") {
                                                var filter = {lobbyID: rLobbyID, 'red.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'red.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            } else if (enemyTokens[i].color == "Blue") {
                                                var filter = {lobbyID: rLobbyID, 'blue.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'blue.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            }
                                        }
                                        await LudoLobby.bulkWrite(bulkOps);
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'green.ordinal': rOrdinal},
                                            {$set: {'green.$.step': 57}},
                                            {new: true}
                                        );
                                    }

                                    if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_1': true}},
                                            {new: true}
                                        );
                                    } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_2': true}},
                                            {new: true}
                                        );
                                        if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                            await LudoLobby.findOneAndUpdate(
                                                {lobbyID: rLobbyID},
                                                {lastPlayer: rUsername},
                                                {new: true}
                                            );
                                        }
                                    }
                                }
                            }
                        }
                        res.send();
                    } else {
                        res.send("It\'s not your turn.");
                    }
                } else {
                    res.send("It\'s not your turn no more.");
                }
            } else if (rColor == "Blue") {
                var lastPlayer = theLobby.lastPlayer;
                var lastMove = theLobby.moves[theLobby.moves.length-1];
                if (lastPlayer != rUsername) {
                    if (lastMove.player == rUsername) {
                        var matchingToken = theLobby.blue.find(obj => obj['ordinal'] === parseInt(rOrdinal));
                        if (matchingToken) {
                            if (parseInt(matchingToken.step) != 0 && parseInt(matchingToken.step) + parseInt(rDie) <= 57) {
                                // Calculate the future steps
                                var steps = parseInt(matchingToken.step) + parseInt(rDie);

                                // Get the enemy tokens
                                const hello = theLobby.yellow.concat(theLobby.green);

                                // Get the enemy token's transform
                                const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, steps);

                                // Filter the tokens that are in the way of the moving token
                                var enemyTokens = [];
                                for (var i = 0; i < hello.length; i++) {
                                    const vColor = hello[i].color;
                                    const vOrdinal = hello[i].ordinal;
                                    const vStep = hello[i].step;
                                    var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                    if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1]) && steps < 57) {
                                        enemyTokens.push(hello[i]);
                                    }
                                }

                                // Handle found token in area
                                if (enemyTokens.length == 0) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'blue.ordinal': rOrdinal},
                                        {$set: {'blue.$.step': steps}},
                                        {new: true}
                                    );
                                } else {
                                    var bulkOps = [];
                                    for (var i = 0; i < enemyTokens.length; i++) {
                                        if (enemyTokens[i].color == "Yellow") {
                                            var filter = {lobbyID: rLobbyID, 'yellow.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'yellow.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        } else if (enemyTokens[i].color == "Green") {
                                            var filter = {lobbyID: rLobbyID, 'green.ordinal': enemyTokens[i].ordinal};
                                            var update = {$set: {'green.$.step': 0}};
                                            bulkOps.push({
                                            updateOne: {filter, update, returnOriginal: false}
                                            });
                                        }
                                    }
                                    await LudoLobby.bulkWrite(bulkOps);
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'blue.ordinal': rOrdinal},
                                        {$set: {'blue.$.step': 57}},
                                        {new: true}
                                    );
                                }

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) + parseInt(rDie) > 57) {
                                await LudoLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID, 'blue.ordinal': rOrdinal},
                                    {$set: {'blue.$.step': 57}},
                                    {new: true}
                                );

                                if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_1': true}},
                                        {new: true}
                                    );
                                } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                    await LudoLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                        {$set: {'moves.$.move_2': true}},
                                        {new: true}
                                    );
                                    if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {lastPlayer: rUsername},
                                            {new: true}
                                        );
                                    }
                                }
                            } else if (parseInt(matchingToken.step) == 0) {
                                if (parseInt(rDie) == 6) {
                                    const hello = theLobby.yellow.concat(theLobby.green);
                                    const tokenTransform = await require('./ludo-coord-mapper.js').mapper(rColor, rOrdinal, 1);
                                    var enemyTokens = [];
                                    for (var i = 0; i < hello.length; i++) {
                                        const vColor = hello[i].color;
                                        const vOrdinal = hello[i].ordinal;
                                        const vStep = hello[i].step;
                                        var enemyTransform = await require('./ludo-coord-mapper.js').mapper(vColor, vOrdinal, vStep);
                                        if ((tokenTransform[0] == enemyTransform[0] && tokenTransform[1] == enemyTransform[1])) {
                                            enemyTokens.push(hello[i]);
                                        }
                                    }

                                    if (enemyTokens.length == 0) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'blue.ordinal': rOrdinal},
                                            {$set: {'blue.$.step': 1}},
                                            {new: true}
                                        );
                                    } else {
                                        var bulkOps = [];
                                        for (var i = 0; i < enemyTokens.length; i++) {
                                            if (enemyTokens[i].color == "Yellow") {
                                                var filter = {lobbyID: rLobbyID, 'yellow.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'yellow.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            } else if (enemyTokens[i].color == "Green") {
                                                var filter = {lobbyID: rLobbyID, 'green.ordinal': enemyTokens[i].ordinal};
                                                var update = {$set: {'green.$.step': 0}};
                                                bulkOps.push({
                                                updateOne: {filter, update, returnOriginal: false}
                                                });
                                            }
                                        }
                                        await LudoLobby.bulkWrite(bulkOps);
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'blue.ordinal': rOrdinal},
                                            {$set: {'blue.$.step': 57}},
                                            {new: true}
                                        );
                                    }

                                    if (lastMove.move_1 == false && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_1': true}},
                                            {new: true}
                                        );
                                    } else if (lastMove.move_1 == true && lastMove.move_2 == false) {
                                        await LudoLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID, 'moves.date': lastMove.date},
                                            {$set: {'moves.$.move_2': true}},
                                            {new: true}
                                        );
                                        if (lastMove.dice[0] != 6 || lastMove.dice[1] != 6) {
                                            await LudoLobby.findOneAndUpdate(
                                                {lobbyID: rLobbyID},
                                                {lastPlayer: rUsername},
                                                {new: true}
                                            );
                                        }
                                    }
                                }
                            }
                        }
                        res.send();
                    } else {
                        res.send("It\'s not your turn.");
                    }
                } else {
                    res.send("It\'s not your turn no more.");
                }
            } else {
                res.send("Bro, no dey hack me ABEG.");
            }

            
            const updatedLobby = await LudoLobby.findOne({lobbyID: rLobbyID});

            const player1_stack = updatedLobby.red.concat(updatedLobby.blue);
            const player2_stack = updatedLobby.yellow.concat(updatedLobby.green);

            let finishedTokenfor1 = true;
            let finishedTokenfor2 = true;

            for (let i = 0; i < player1_stack.length; i++) {
                if (player1_stack[i].step < 57) {
                    finishedTokenfor1 = false;
                    break;
                }
            }

            for (let i = 0; i < player2_stack.length; i++) {
                if (player2_stack[i].step < 57) {
                    finishedTokenfor2 = false;
                    break;
                }
            }

            if (finishedTokenfor1) {
                await LudoLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player1}, {new: true});
            } else if (finishedTokenfor2) {
                await LudoLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player2}, {new: true});
            }
        } else {
            console.log("Lobby no dey.");
        }
    } else {
        console.log("Even account sef no dey.")
    }
}

async function completeTransaction(req, res) {
    const {rLobbyID} = req.body;
    
    const updatedLobby = await LudoLobby.findOne({lobbyID: rLobbyID});
    if (updatedLobby.paid == false) {
        await LudoLobby.findOneAndUpdate(
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
                                game: "Ludo",
                                challenge: true,
                                amountInvolved: updatedLobby.money,
                                date: Date.now().toString()
                            },
                            moneyTransact: {
                                credit: true,
                                game: true,
                                theGame: "Ludo",
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
                            game: "Ludo",
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
                                game: "Ludo",
                                challenge: true,
                                amountInvolved: updatedLobby.money,
                                date: Date.now().toString()
                            },
                            moneyTransact: {
                                credit: true,
                                game: true,
                                theGame: "Ludo",
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
                            game: "Ludo",
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
}

module.exports = {
    joinLobby: joinLobby,
    startLobby: startLobby,
    rollDice: rollDice,
    makeMove: makeMove,
    completeTransaction, completeTransaction
}