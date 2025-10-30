require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/WhotLobby.js');
const WhotLobby = mongoose.model('whotLobbys');

require('./model/Account.js');
const Account = mongoose.model('accounts');

require('./model/Room.js');
const Room = mongoose.model('rooms');

async function joinLobby(req, res) {
    // Enable SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    WhotLobby.watch().on('change', async (change) => {
        const theLobby = await WhotLobby.findOne({_id: change.documentKey._id});
        if (theLobby.lobbyID == req.params.lobbyID) {
            var playerCard = [];
            var opponentCardCount = 0;
            if (req.params.user == theLobby.player1) {
                playerCard = theLobby.player1_stack;
                opponentCardCount = theLobby.player2_stack.length;
            } else if (req.params.user == theLobby.player2) {
                playerCard = theLobby.player2_stack;
                opponentCardCount = theLobby.player1_stack.length;
            }
            const moveJSON = {
                player: theLobby.moves[theLobby.moves.length-1].player,
                shape: theLobby.moves[theLobby.moves.length-1].card.shape,
                number: theLobby.moves[theLobby.moves.length-1].card.number,

                playerCard: playerCard,
                opponentCardCount: opponentCardCount,
                required: theLobby.moves[theLobby.moves.length-1].require,

                winner: theLobby.winner,
                finals: theLobby.finals,
                
                date: Date.now().toString()
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
  
    try {
        const userAccount =  await Account.findOne({username: rUsername});
        const theLobby =  await WhotLobby.findOne({lobbyID: rLobbyID});
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

                var playerCard = [];
                var opponentCardCount = 0;
                if (rUsername == theLobby.player1) {
                    playerCard = theLobby.player1_stack;
                    opponentCardCount = theLobby.player2_stack.length;
                } else if (rUsername == theLobby.player2) {
                    playerCard = theLobby.player2_stack;
                    opponentCardCount = theLobby.player1_stack.length;
                }
                

                const firstAccount = await Account.findOne({username: theLobby.player1});
                const secondAccount = await Account.findOne({username: theLobby.player2});
                
                const moveJSON = {
                    player1: theLobby.player1,
                    player1_type: theLobby.player1_ball,
                    player1_idName: firstAccount.idName,
                    player1_profile: firstAccount.profilePic.toString('hex'),
                    player2: theLobby.player2,
                    player2_type: theLobby.player2_ball,
                    player2_idName: secondAccount.idName,
                    player2_profile: secondAccount.profilePic.toString('hex'),

                    player: theLobby.moves[theLobby.moves.length-1].player,
                    shape: theLobby.moves[theLobby.moves.length-1].card.shape,
                    number: theLobby.moves[theLobby.moves.length-1].card.number,
                    cardID: theLobby.moves[theLobby.moves.length-1].card.cardID,

                    playerCard: playerCard,
                    opponentCardCount: opponentCardCount,

                    winner: theLobby.winner,
                    finals: theLobby.finals,
                    
                    date: Date.now().toString()
                }
                res.send(JSON.stringify(moveJSON));
            }
        } else {
            res.send();
        }
    } catch (error) {
        console.log(error);
    }
}

async function makeMove(req, res) {
    const {rUsername, rLobbyID, rShape, rNumber, rCardID, rReq} = req.body;
  
    try {
        const userAccount =  await Account.findOne({username: rUsername});
        const theLobby =  await WhotLobby.findOne({lobbyID: rLobbyID});

        if (userAccount) {
            if (theLobby) {
                const lastShape = theLobby.moves[theLobby.moves.length - 1].card.shape;
                const lastNumber = theLobby.moves[theLobby.moves.length - 1].card.number;
                const lastPlayer = theLobby.moves[theLobby.moves.length - 1].player;
                const lastMarket = theLobby.moves[theLobby.moves.length - 1].market;
                const lastRequest = theLobby.moves[theLobby.moves.length - 1].require;
                const lastCardID = theLobby.moves[theLobby.moves.length - 1].cardID;
                if (lastPlayer != rUsername) {
                    if (lastNumber == 1 && lastMarket == false && lastRequest == 'none') {
                        res.send('Hold on. You can\'t play until your opponent does.');
                    } else if (lastNumber == 2 && lastMarket == false && lastRequest == 'none') {
                        if (rNumber == 2) {
                            if (theLobby.player1 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: 'none'
                                        }},
                                        $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: 'none'
                                        }},
                                        $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Back to sender! :)');
                        } else if (rNumber == 22) {
                            // Make a 'void' move, for the market
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: lastShape, number: lastNumber, cardID: lastCardID},
                                        market: true,
                                        require: 'none'
                                    }}
                                },
                                {new: true}
                            );
                            if (theLobby.player1 == rUsername) {
                                // Take one card from market
                                await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {player1_stack: {
                                                shape: theLobby.stack[theLobby.stack.length-1].shape,
                                                number: theLobby.stack[theLobby.stack.length-1].number,
                                                cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                            }},
                                            $pull: {stack: {
                                                shape: theLobby.stack[theLobby.stack.length-1].shape,
                                                number: theLobby.stack[theLobby.stack.length-1].number,
                                                cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                            }}
                                        },
                                        {new: true}
                                );
                                // Take second card from market
                                await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {player1_stack: {
                                                shape: theLobby.stack[theLobby.stack.length-2].shape,
                                                number: theLobby.stack[theLobby.stack.length-2].number,
                                                cardID: theLobby.stack[theLobby.stack.length-2].cardID,
                                            }},
                                            $pull: {stack: {
                                                shape: theLobby.stack[theLobby.stack.length-2].shape,
                                                number: theLobby.stack[theLobby.stack.length-2].number,
                                                cardID: theLobby.stack[theLobby.stack.length-2].cardID,
                                            }}
                                        },
                                        {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                // Take one card from market
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                                // Take second card from market
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-2].shape,
                                            number: theLobby.stack[theLobby.stack.length-2].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-2].shape,
                                            number: theLobby.stack[theLobby.stack.length-2].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Collect pick two! :(');
                        } else {
                            res.send('Play the same number or pick two.');
                        }
                    } else if (lastNumber == 5 && lastMarket == false && lastRequest == 'none') {
                        if (rNumber == 5) {
                            if (theLobby.player1 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: 'none'
                                        }},
                                        $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: 'none'
                                        }},
                                        $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Back to sender! :)');
                        } else if (rNumber == 22) {
                            // Make a 'void' move, for the market
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: lastShape, number: lastNumber, cardID: lastCardID},
                                        market: true,
                                        require: 'none'
                                    }}
                                },
                                {new: true}
                            );
                            if (theLobby.player1 == rUsername) {
                                // Take one card from market
                                await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {player1_stack: {
                                                shape: theLobby.stack[theLobby.stack.length-1].shape,
                                                number: theLobby.stack[theLobby.stack.length-1].number,
                                                cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                            }},
                                            $pull: {stack: {
                                                shape: theLobby.stack[theLobby.stack.length-1].shape,
                                                number: theLobby.stack[theLobby.stack.length-1].number,
                                                cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                            }}
                                        },
                                        {new: true}
                                );
                                // Take second card from market
                                await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {player1_stack: {
                                                shape: theLobby.stack[theLobby.stack.length-2].shape,
                                                number: theLobby.stack[theLobby.stack.length-2].number,
                                                cardID: theLobby.stack[theLobby.stack.length-2].cardID,
                                            }},
                                            $pull: {stack: {
                                                shape: theLobby.stack[theLobby.stack.length-2].shape,
                                                number: theLobby.stack[theLobby.stack.length-2].number,
                                                cardID: theLobby.stack[theLobby.stack.length-2].cardID,
                                            }}
                                        },
                                        {new: true}
                                );
                                // Take third card from market
                                await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {player1_stack: {
                                                shape: theLobby.stack[theLobby.stack.length-3].shape,
                                                number: theLobby.stack[theLobby.stack.length-3].number,
                                                cardID: theLobby.stack[theLobby.stack.length-3].cardID,
                                            }},
                                            $pull: {stack: {
                                                shape: theLobby.stack[theLobby.stack.length-3].shape,
                                                number: theLobby.stack[theLobby.stack.length-3].number,
                                                cardID: theLobby.stack[theLobby.stack.length-3].cardID,
                                            }}
                                        },
                                        {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                // Take one card from market
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                                // Take second card from market
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-2].shape,
                                            number: theLobby.stack[theLobby.stack.length-2].number,
                                            cardID: theLobby.stack[theLobby.stack.length-2].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-2].shape,
                                            number: theLobby.stack[theLobby.stack.length-2].number,
                                            cardID: theLobby.stack[theLobby.stack.length-2].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                                // Take third card from market
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-3].shape,
                                            number: theLobby.stack[theLobby.stack.length-3].number,
                                            cardID: theLobby.stack[theLobby.stack.length-3].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-3].shape,
                                            number: theLobby.stack[theLobby.stack.length-3].number,
                                            cardID: theLobby.stack[theLobby.stack.length-3].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Collect pick three! :(');
                        } else {
                            res.send('Play the same number or pick three.');
                        }
                    } else if (lastNumber == 8 && lastMarket == false && lastRequest == 'none') {
                        res.send('Suspension. You lose a turn.');
                    } else if (lastNumber == 14 && lastMarket == false && lastRequest == 'none') {
                        if (rNumber == 22) {
                            // Make a 'void' move, for the market
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: lastShape, number: lastNumber, cardID: lastCardID},
                                        market: true,
                                        require: 'none'
                                    }}
                                },
                                {new: true}
                            );
                            if (theLobby.player1 == rUsername) {
                                // Take one card from market
                                await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {player1_stack: {
                                                shape: theLobby.stack[theLobby.stack.length-1].shape,
                                                number: theLobby.stack[theLobby.stack.length-1].number,
                                                cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                            }},
                                            $pull: {stack: {
                                                shape: theLobby.stack[theLobby.stack.length-1].shape,
                                                number: theLobby.stack[theLobby.stack.length-1].number,
                                                cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                            }}
                                        },
                                        {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                // Take one card from market
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Collect general market! :(');
                        } else {
                            res.send('General market. You lose a turn');
                        }
                    } else if (lastNumber == 20 && lastMarket == false && lastRequest != 'none') {
                        if (rNumber != 22) {
                            if (lastRequest != 'none') {
                                if (rShape == lastRequest) {
                                    if (theLobby.player1 == rUsername) {
                                        await WhotLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {
                                                $push: {moves: {
                                                    player: rUsername,
                                                    card: {shape: rShape, number: rNumber, cardID: rCardID},
                                                    market: false,
                                                    require: 'none'
                                                }},
                                                $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                            },
                                            {new: true}
                                        );
                                    } else if (theLobby.player2 == rUsername) {
                                        await WhotLobby.findOneAndUpdate(
                                            {lobbyID: rLobbyID},
                                            {
                                                $push: {moves: {
                                                    player: rUsername,
                                                    card: {shape: rShape, number: rNumber, cardID: rCardID},
                                                    market: false,
                                                    require: 'none'
                                                }},
                                                $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                            },
                                            {new: true}
                                        );
                                    }
                                    res.send('Reciprocated!');
                                } else {
                                    res.send('Play a ' + lastRequest);
                                }
                            } else {
                                if (theLobby.player1 == rUsername) {
                                    await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {moves: {
                                                player: rUsername,
                                                card: {shape: rShape, number: rNumber, cardID: rCardID},
                                                market: false,
                                                require: 'none'
                                            }},
                                            $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                        },
                                        {new: true}
                                    );
                                } else if (theLobby.player2 == rUsername) {
                                    await WhotLobby.findOneAndUpdate(
                                        {lobbyID: rLobbyID},
                                        {
                                            $push: {moves: {
                                                player: rUsername,
                                                card: {shape: rShape, number: rNumber, cardID: rCardID},
                                                market: false,
                                                require: 'none'
                                            }},
                                            $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                        },
                                        {new: true}
                                    );
                                }
                            }
                        } else {
                            // Make a 'void' move, for the market
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: lastShape, number: lastNumber, cardID: lastCardID},
                                        market: true,
                                        require: 'none'
                                    }}
                                },
                                {new: true}
                            );
                            if (theLobby.player1 == rUsername) {
                                // Take card from the market, and add to the player stack
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player1_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                // Take card from the market, and add to the player stack
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID,
                                        }}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Market!');
                        }
                    } else if (lastNumber == 20 && lastMarket == true && lastRequest == 'none') {
                        if (theLobby.player1 == rUsername) {
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: rShape, number: rNumber, cardID: rCardID},
                                        market: false,
                                        require: 'none'
                                    }},
                                    $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                },
                                {new: true}
                            );
                        } else if (theLobby.player2 == rUsername) {
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: rShape, number: rNumber, cardID: rCardID},
                                        market: false,
                                        require: 'none'
                                    }},
                                    $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                },
                                {new: true}
                            );
                        }
                        res.send('Nice one!');
                    } else {
                        if (lastShape == rShape || lastNumber == rNumber) {
                            if (theLobby.player1 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: 'none'
                                        }},
                                        $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: 'none'
                                        }},
                                        $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Nice one!');
                        } else if (rNumber == 22) {
                            // Make a 'void' move, for the market
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: lastShape, number: lastNumber, cardID: lastCardID},
                                        market: true,
                                        require: 'none'
                                    }}
                                },
                                {new: true}
                            );
                            if (theLobby.player1 == rUsername) {
                                // Take card from the market, and add to the player stack
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player1_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                // Take card from the market, and add to the player stack
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Market!');
                        } else if (rNumber == 20) {
                            if (theLobby.player1 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: rReq
                                        }},
                                        $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: rReq
                                        }},
                                        $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Requesting a ' + rReq);
                        } else {
                            res.send('Invalid move.');
                        }
                    }
                } else {
                    const special = [1, 8];
                    if (special.indexOf(lastNumber) >= 0 && lastMarket == false) {
                        if (lastShape == rShape || lastNumber == rNumber) {
                            if (theLobby.player1 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false
                                        }},
                                        $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber},
                                            market: false
                                        }},
                                        $pull: {player2_stack: {shape: rShape, number: rNumber}}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Nice move!');
                        } else if (rNumber == 22) {
                            // Make a 'void' move, for the market
                            await WhotLobby.findOneAndUpdate(
                                {lobbyID: rLobbyID},
                                {
                                    $push: {moves: {
                                        player: rUsername,
                                        card: {shape: lastShape, number: lastNumber, cardID: lastCardID},
                                        market: true,
                                        require: 'none'
                                    }}
                                },
                                {new: true}
                            );
                            if (theLobby.player1 == rUsername) {
                                // Take card from the market, and add to the player stack
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player1_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                // Take card from the market, and add to the player stack
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {player2_stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }},
                                        $pull: {stack: {
                                            shape: theLobby.stack[theLobby.stack.length-1].shape,
                                            number: theLobby.stack[theLobby.stack.length-1].number,
                                            cardID: theLobby.stack[theLobby.stack.length-1].cardID
                                        }}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Market!');
                        } else if (rNumber == 20) {
                            if (theLobby.player1 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: rReq
                                        }},
                                        $pull: {player1_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            } else if (theLobby.player2 == rUsername) {
                                await WhotLobby.findOneAndUpdate(
                                    {lobbyID: rLobbyID},
                                    {
                                        $push: {moves: {
                                            player: rUsername,
                                            card: {shape: rShape, number: rNumber, cardID: rCardID},
                                            market: false,
                                            require: rReq
                                        }},
                                        $pull: {player2_stack: {shape: rShape, number: rNumber, cardID: rCardID}}
                                    },
                                    {new: true}
                                );
                            }
                            res.send('Requesting a ' + rReq);
                        } else {
                            res.send('Invalid move.');
                        }
                    } else {
                        res.send('It\'s not your turn.');
                    }
                }

                const updatedLobby = await WhotLobby.findOne({lobbyID: rLobbyID});

                if (updatedLobby.player1_stack.length == 0) {
                    await WhotLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player1}, {new: true});
                } else if (updatedLobby.player2_stack.length == 0) {
                    await WhotLobby.findOneAndUpdate({lobbyID: rLobbyID}, {winner: updatedLobby.player2}, {new: true});
                }

                if (updatedLobby.stack.length <= 3) {
                    const newStack =  await require('./generate-whot-stack.js').generateStack();
                    await WhotLobby.findOneAndUpdate(
                        {lobbyID: rLobbyID},
                        {stack: newStack},
                        {new: true}
                    );
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function refreshLobby(req, res) {
    const {rLobbyID} = req.body;

    try {
        const theLobby = await WhotLobby.findOne({lobbyID: rLobbyID});
        if (theLobby) {
            const num = theLobby.refreshed + 1;
            await WhotLobby.findOneAndUpdate(
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
        const updatedLobby = await WhotLobby.findOne({lobbyID: rLobbyID});
        if (updatedLobby.paid == false) {
            await WhotLobby.findOneAndUpdate(
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
                                    game: "Whot",
                                    challenge: true,
                                    amountInvolved: updatedLobby.money,
                                    date: Date.now().toString()
                                },
                                moneyTransact: {
                                    credit: true,
                                    game: true,
                                    theGame: "Whot",
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
                                game: "Whot",
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
                    await Account.findOneAndUpdate(
                        {username: updatedLobby.player2},
                        {
                            funds: money,
                            $push: {
                                gameTransact: {
                                    win: true,
                                    game: "Whot",
                                    challenge: true,
                                    amountInvolved: updatedLobby.money,
                                    date: Date.now().toString()
                                },
                                moneyTransact: {
                                    credit: true,
                                    game: true,
                                    theGame: "Whot",
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
                                game: "Whot",
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
    joinLobby: joinLobby,
    startLobby: startLobby,
    makeMove: makeMove,
    refreshLobby: refreshLobby,
    completeTransaction: completeTransaction
}