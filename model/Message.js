const mongoose = require('mongoose');
const {Schema} = mongoose;

const messageNoteSchema = new Schema({
    user: String,
    message: String,
    date: String
});

const messageSchema = new Schema({
    messageID: String,
    messages: [messageNoteSchema],
    lastMsg: String,
});

mongoose.model('messages', messageSchema);