const fs = require('fs');
const mongo = require('../mongoose/mongo');

const randomQuoteURI = 'https://api.api-ninjas.com/v1/quotes';
const randomAvatarURI = 'https://robohash.org';

const names = JSON.parse(fs.readFileSync('utils/names.json', 'utf-8'));

const fetch_random_quote = () => {
    const quoteApiKey = process.env.QUOTE_API_KEY;
    return fetch(randomQuoteURI, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': quoteApiKey,
        }
    }).then(res => res.json()).then(data => {
        const quote = data[0].quote;
        return quote;
    }).catch(err => console.log(err));
};

const get_random_avatar_url = () => {
    const randomSeed = crypto.randomUUID();
    return randomAvatarURI + '/' + randomSeed;
}

const get_random_bot = () => {
    const {firstNames, surnames} = names;
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
    const randomAvatarUrl = get_random_avatar_url();
    return {firstName: randomFirstName, surname: randomSurname, avatarUrl: randomAvatarUrl};
}

const create_predefined_chats = (clientId) => {
    const predefinedChatsAmount = 3;

    for (let i = 0; i < predefinedChatsAmount; i++) {
        const {firstName, surname, avatarUrl} = get_random_bot();
        mongo.save_new_chat(clientId, firstName, surname, avatarUrl);
    }
}

const create_auto_messages_interval = (clientId, res) => {
    return setInterval(async () => {
        const userChats = await mongo.get_user_chats(clientId, '');

        if (userChats.length) {
            const randomChat = userChats[Math.floor(Math.random() * userChats.length)];
            const randomChatId = randomChat.id;
            const randomQuote = await fetch_random_quote();

            mongo.save_new_message(randomQuote, randomChatId).then( newMessageSnapshot => {
                const newMessageJSON = JSON.stringify(newMessageSnapshot);
                res.write('data: ' + newMessageJSON + '\n\n');
            });
        }

    }, 5000);
};

module.exports = {
    fetch_random_quote,
    get_random_avatar_url,
    create_predefined_chats,
    create_auto_messages_interval
};