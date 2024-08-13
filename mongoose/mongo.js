const mongoose = require('mongoose');
const Message = require('./models/message');
const Chat = require('./models/chat');

mongoose.connect(process.env.DB_URI,  {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('DB connection succeeded!');
}).catch(err => console.log(err));

const save_new_message = (text, chatId, clientId='0') => {
    const newMessage = new Message({
        text,
        chatId,
        clientId,
    });

    return newMessage.save();
};

const save_new_chat = (clientId, botName, botSurName, botAvatarUrl) => {
    const newChat = new Chat({
        botName,
        botSurName,
        botAvatarUrl,
        clientId
    });

    return newChat.save();
}

const get_user_chats = (clientId, searchQuery) => {
    return Chat.find({
        clientId,
        $or: [
            {
                botName: {
                    $regex: searchQuery,
                    $options: 'i'
                }
            },
            {
                botSurName: {
                    $regex: searchQuery,
                    $options: 'i'
                }
            }
        ]
    })
}

const get_chat_messages = (chatId) => {
    return new Promise((res, rej) => {
        Message.find({
            chatId,
        }).then(res).catch(rej)})
}

const update_chat = (chatId, update) => {
    return new Promise((res, rej) => {
        Chat.findByIdAndUpdate(chatId, update).then(res).catch(rej)
    });
}

const delete_chat = async (chatId) => {
    const messagesId = (await get_chat_messages(chatId)).map(message => message.id);

    await Promise.all(messagesId.map(id => {
        return new Promise((res, rej) => {
            Message.findByIdAndDelete(id).then(res).catch(rej)
        });
    }))

    return new Promise((res, rej) => {
        Chat.findByIdAndDelete(chatId).then(res).catch(rej)
    })
}

const update_message = (messageId, update) => {
    return new Promise((res, rej) => {
        Message.findByIdAndUpdate(messageId, update).then(res).catch(rej);
    })
}

const get_last_chat_message = (chatId) => {
    return new Promise((res, rej) => {
        Message.findOne({
            chatId,
        }).sort({createdAt: -1}).then(res).catch(rej)})
}

const get_chat_by_id = (id) => {
    return Chat.findById(id).then(res => res);
}

module.exports = {
    save_new_message,
    save_new_chat,
    get_user_chats,
    get_chat_messages,
    update_chat,
    delete_chat,
    update_message,
    get_last_chat_message,
    get_chat_by_id
}