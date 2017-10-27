const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});
const _ = require('lodash');

const usernames = JSON.parse(process.env.TELEGRAM_USERNAMES);

function isValidMessage(message) {
    console.log('check user: ' + message.from.username);
    return _.find(usernames, message.from.usernames);
}

let userSelectPlace = {};

let place1 = {id: 1, name: "Улица", pin: 14};
let place2 = {id: 2, name: "Тамбур", pin: 12};
let place3 = {id: 3, name: "Нагреватель", pin: 13};
let places = [place1, place2, place3];

let period1 = {id: 4, name: "Сейчас"};
let period2 = {id: 5, name: "За день"};
let period3 = {id: 6, name: "За неделю"};
let period4 = {id: 7, name: "За месяц"};

let periods = [period1, period2, period3, period4];

function sendInitMessage(chatId) {
    bot.sendMessage(chatId, 'Можно узнать погоду в бане', {
        "reply_markup": {
            "keyboard": [places.map(i => i.name)]
        }
    });
}

function sendSelectPeriodMessage(chatId) {
    bot.sendMessage(chatId, 'Подскажи, за какой период нужно?', {
        "reply_markup": {
            "keyboard": [periods.map(i => i.name), ["Назад"]]
        }
    })
}

function normalizeNum(num) {
    if (num < 10)
        return '0' + num;
    return num + '';
}

function formatDate(str) {
    let date = new Date(str);
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(i => normalizeNum(i)).join('-') + ' ' +
        [date.getHours(), date.getMinutes(), date.getSeconds()].map(i => normalizeNum(i)).join(':')
}

module.exports = function (repository) {
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        if (isValidMessage(msg)) {

            let place = _.find(places, p => p.name === msg.text);
            if (place) {
                userSelectPlace[msg.from.username] = place;
                sendSelectPeriodMessage(chatId)
            } else {
                if (msg.text === 'Назад')
                    sendInitMessage(chatId);
                else {
                    let period = _.find(periods, p => p.name === msg.text);
                    if (period) {
                        if (!userSelectPlace[msg.from.username])
                            sendInitMessage(chatId);
                        else {
                            let p = userSelectPlace[msg.from.username];
                            let dht = repository.getDHT();
                            dht.then(r => {
                                let time = formatDate(r.timestamp);
                                let temp = _.find(r.data, d => d.dht === p.pin);
                                bot.sendMessage(chatId, 'Данные на ' + time + '\r\n' + p.name + ', ' + period.name + ': температура ' + temp.t + ', влажность ' + temp.h);

                            })
                        }

                    } else {
                        sendInitMessage(chatId)
                    }
                }
            }

        }
    });
};
