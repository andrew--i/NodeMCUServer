const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});
const _ = require('lodash');
const dht = require('../processing/dht');
const chart = require('../processing/chart');

const usernames = JSON.parse(process.env.TELEGRAM_USERNAMES);

function isValidMessage(message) {
    console.log('check user: ' + message.from.username);
    return _.find(usernames, message.from.usernames);
}


let period1 = {id: 0, name: "Сейчас"};
let period2 = {id: 5, name: "Вчера"};
let period3 = {id: 6, name: "За неделю"};
let period4 = {id: 7, name: "За месяц"};

let periods = [period1, period2, period3, period4];

function sendInitMessage(chatId) {
    bot.sendMessage(chatId, 'Можно узнать погоду в бане', {
        "reply_markup": {
            "keyboard": [periods.map(i => i.name)]
        }
    });
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

function isNow(period) {
    return period.id === period1.id;
}

function isYesterday(period) {
    return period.id === period2.id;
}

function sendNowPictures(repository, chatId) {
    let currentDHT = repository.getDHT();
    currentDHT.then(r => {
        let time = formatDate(r.timestamp);
        let chartsData = dht.getBarChartData(r.data);

        _.map(chartsData, c => {
            chart.buffer(c).then(i => {
                bot.sendPhoto(chatId, i, {caption: 'График на момент ' + time})
                sendInitMessage(chatId);
            })
        });
    });
}

function sendYesterdayPictures(repository, chatId) {
    let yesterdayDHT = repository.getDHTForDay();
    let yesterday = new Date(repository.getCurrentDate().getTime() - 24 * 60 * 60 * 1000);
    let title = _.map([yesterday.getDate(), yesterday.getMonth(), yesterday.getFullYear()], normalizeNum).join('-');
    yesterdayDHT.then(r => {
        let charts = dht.getLineChartData(r, title)
        _.map(charts, c => {
            chart.buffer(c).then(i => {
                bot.sendPhoto(chatId, i, {caption: 'График за вчера ( ' + title + ' )'});
                sendInitMessage(chatId);
            })
        })

    })

}

module.exports = function (repository) {
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        if (isValidMessage(msg)) {

            let period = _.find(periods, p => p.name === msg.text);
            if (period) {
                if (isNow(period)) {
                    sendNowPictures(repository, chatId);
                } else if (isYesterday(period)) {
                    sendYesterdayPictures(repository, chatId);
                } else {
                    bot.sendMessage(chatId, "Еще в разработки, ожидайте позже")
                    sendInitMessage(chatId);
                }
            } else {
                sendInitMessage(chatId);
            }

        }
    });
};
