require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

require('./model/Message.js');
const Message = mongoose.model('messages');

async function retrieveMessages(req, res) {
    let response = {};
    const {rUser1, rUser2, rPassword} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUser1});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (result) {
                    var otherAccount = await Account.findOne({username: rUser2});
                    if (otherAccount != null) {
                        // Extract the matching object from the array
                        var matchingObject = userAccount.messages.find(obj => obj['otherUser'] === rUser2);
                        if (matchingObject) {
                            var mes = await Message.findOne({messageID: matchingObject.messageID});
                            response.code = 0;
                            response.msg = 'Retrieved messages';
                            response.messages = mes.messages;
                            response.id = matchingObject.messageID;
                            res.send(response);
                        } else {
                            const idStr = await require('./generate-string.js').generateRandomString(48);
                            var newMessage = new Message({
                                messageID: idStr,
                                messages: []
                            });
                            await newMessage.save();
        
                            
                            const newMessage1 = {
                                otherUser: rUser2,
                                messageID: idStr
                            }
                            
                            await Account.findOneAndUpdate(
                                {username: rUser1},
                                {$push: {messages: newMessage1}},
                                {new: true}
                            );
        
                            const newMessage2 = {
                                otherUser: rUser1,
                                messageID: idStr
                            }
                            
                            await Account.findOneAndUpdate(
                                {username: rUser2},
                                {$push: {messages: newMessage2}},
                                {new: true}
                            );
                            response.code = 1;
                            response.msg = 'No messages found. Text with this guy.';
                            response.messages = [];
                            response.id = idStr;
                            res.send(response);
                        }
                    }
                } else {
                    res.send('Log into your account');
                }
            });
        } else {
            res.send('Log into your account');
        }
    } catch (error) {
        console.log(error);
    }
}

async function getMessages(req, res) {
    // Enable SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    Message.watch().on('change', async (change) => {
        const mess = await Message.findOne({_id: change.documentKey._id});
        if (mess.messageID == req.params.message) {
            const msgJSON = mess.messages[mess.messages.length-1]

            res.write(JSON.stringify(msgJSON) + '\n\n');
        }
    });

    // Close the connection when the client disconnects
    req.on('close', () => {
        res.end();
    });
}

async function sendMessages(req, res) {
    // Send initial message
    const {rUser1, rUser2, rPassword, msg} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUser1});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }
                
                if (result) {
                    var otherAccount = await Account.findOne({username: rUser2});
                    if (otherAccount != null) {
                        // Extract the matching object from the array
                        const matchingObject = userAccount.messages.find(obj => obj['otherUser'] === rUser2);
                        if (matchingObject) {
                            const newMessage = {
                                user: rUser1,
                                message: msg,
                                date: Date.now().toString()
                            }
                            
                            await Message.findOneAndUpdate(
                                {messageID: matchingObject.messageID},
                                {$push: {messages: newMessage}, lastMsg: msg},
                                {new: true}
                            );
                        } else {
                            console.log('No matching object found. Creating one.');
                            const idStr = await require('./generate-string.js').generateRandomString(48);

                            const newMessagex = {
                                user: rUser1,
                                message: msg,
                                date: Date.now().toString()
                            }
                            var newMessage = new Message({
                                messageID: idStr,
                                messages: [newMessagex]
                            });
                            await newMessage.save();

                            
                            const newMessage1 = {
                                otherUser: rUser2,
                                messageID: idStr
                            }
                            
                            await Account.findOneAndUpdate(
                                {username: rUser1},
                                {$push: {messages: newMessage1}},
                                {new: true}
                            );

                            const newMessage2 = {
                                otherUser: rUser1,
                                messageID: idStr
                            }
                            
                            await Account.findOneAndUpdate(
                                {username: rUser2},
                                {$push: {messages: newMessage2}},
                                {new: true}
                            );
                        }
                    }
                } else {
                    res.send('Log into your account');
                }
            });
        } else {
            res.send('Log into your account');
        }
    } catch (error) {
        console.log(error);
    }
}

async function getChats(req, res) {
    // Send initial message
    const {rUsername, rPassword} = req.body;

    try {
        const userAccount = await Account.findOne({username: rUsername});
        if (userAccount != null) {
            bcrypt.compare(rPassword, userAccount.password, async (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }
                
                if (result) {
                    const chats = userAccount.messages;
                    const messageLength = chats.length > 20 ? 20 : chats.length;
                    var sendChats = [];
                    for (let i = 0; i < messageLength; i++) {
                        const otherUser = await Account.findOne({username: chats[i].otherUser});
                        const profilePic = otherUser.profilePic ? otherUser.profilePic.toString('hex') : null;
                        const chatJSON = {
                            username: chats[i].otherUser,
                            profilePic: profilePic,
                            lastMsg: chats[i].lastMsg
                        }
                        sendChats.push(chatJSON);
                    }
                    res.send({code: 0, msg: "Success!", chats: sendChats});
                } else {
                    res.send({code: 1, msg: "Log into your account.", chats: null});
                }
            });
        } else {
            res.send({code: 1, msg: "Log into your account.", chats: null});
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getMessages: getMessages,
    sendMessages: sendMessages,
    retrieveMessages: retrieveMessages,
    getChats: getChats
}