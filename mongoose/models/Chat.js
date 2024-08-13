const {Schema} = require('mongoose');
const mongoose = require("mongoose");

const ChatSchema = new Schema({
        botName: String,
        botSurName: String,
        botAvatarUrl: String,
        clientId: String,
})

module.exports = mongoose.model('Chat', ChatSchema);