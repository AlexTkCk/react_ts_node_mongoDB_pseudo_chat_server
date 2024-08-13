const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const cors = require('cors');
const bodyParser = require("express");
const utils = require("./utils/utils");
const mongo = require("./mongoose/mongo");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

let clients = [];

// --- Initial set and SSE
app.get('/:id', async (req, res) => {
    const clientId = req.params.id;

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
    }

    res.writeHead(200, headers);

    const newClient = {
        id: clientId,
        res
    }
    clients.push(newClient);

    const userChats = await mongo.get_user_chats(clientId, '');

    if (!userChats.length) {
        utils.create_predefined_chats(clientId);
    }

    const autoMessagesInterval = utils.create_auto_messages_interval(clientId, res);

    req.on('close', () => {
        clearInterval(autoMessagesInterval);
        clients = clients.filter(client => client.id !== clientId);
    })
})

// --- Auto-response
app.get('/auto-response/:chatId/:clientId', async (req, res) => {
    const {chatId, clientId} = req.params;
    const quote = await utils.fetch_random_quote()
    const answerMessageSnapshot = await mongo.save_new_message(quote, chatId);
    const client = clients.find(client => client.id === clientId);

    setTimeout(() => {
        client.res.write(`data: ${JSON.stringify(answerMessageSnapshot)}\n\n`);
    }, 3000);

    res.sendStatus(200);
})

// --- Chats
app.get('/chats/client/:clientId', async (req, res) => {
    const clientId = req.params.clientId;
    const searchQuery = req.query.searchQuery || '';

    const chats = await mongo.get_user_chats(clientId, searchQuery);
    res.status(200).send(chats);
})

app.get('/chats/:id', async (req, res) => {
    const id = req.params.id;

    const chat = await mongo.get_chat_by_id(id);
    res.status(200).send(chat);
})

app.post('/chats', async (req, res) => {
    const {botName, botSurName, clientId} = req.body;
    const botAvatarUrl = utils.get_random_avatar_url();
    mongo.save_new_chat(clientId, botName, botSurName, botAvatarUrl)
        .then(snapshot => {
            res.status(200).send(snapshot);
        })
        .catch(console.error);

})

app.put('/chats', async (req, res) => {
    const {chatId, botName, botSurName} = req.body;

    const update = {
        botName,
        botSurName
    };

    mongo.update_chat(chatId, update).then(() => {
        res.sendStatus(200);
    }).catch(err => {
        res.status(400).send(err);
    });
})

app.delete('/chats', async (req, res) => {
    const {chatId} = req.body;

    mongo.delete_chat(chatId).then(() => {
        res.sendStatus(200);
    }).catch(err => {
        res.status(400).send(err)
    });
})

// --- Messages
app.get('/messages/:chatId', async (req, res) => {
    const chatId = req.params.chatId;
    mongo.get_chat_messages(chatId).then(messages => {
        res.status(200).send(messages);
    }).catch(err => {
        res.status(400).send(err);
    });
})


app.post('/messages', async (req, res) => {
    const {text, clientId, chatId} = req.body;
    mongo.save_new_message(text, chatId, clientId).then((snapshot) => {
        res.status(201).send(snapshot);
    }).catch(err => {
        res.status(400).send(err);
    });


})

app.put('/messages', async (req, res) => {
    const {id, text} = req.body;
    const update = {text};

    mongo.update_message(id, update).then(() => {
        res.sendStatus(200);
    }).catch(err => {
        res.status(400).send(err)
    });
})

app.listen(port, () => {
    console.log('Server started on port ' + port);
    console.log('Timestamp : ' + Date.now());
})