const {Schema} = require('mongoose');
const mongoose = require("mongoose");

const MessageSchema = new Schema({
    text: String,
    clientId: String,
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
    },
},
{
        timestamps: true,
    })

module.exports = mongoose.model('Message', MessageSchema);