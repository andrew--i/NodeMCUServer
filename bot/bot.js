//proxy
// const AgentHTTPS = require('socks5-https-client/lib/Agent');


const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: true, filepath: false,
  // request: {
  //   agentClass: AgentHTTPS,
  //   agentOptions: {
  //     socksHost: 'localhost',
  //     socksPort: 9050
  //   }
  // }
});
const _ = require('lodash');
const dht = require('../processing/dht');
const chart = require('../processing/chart');

const usernames = process.env.TELEGRAM_USERNAMES ? process.env.TELEGRAM_USERNAMES.split(',') : undefined;
console.log('usernames: ' + usernames);

function isValidMessage(message) {
  if (!usernames || usernames.length === 0)
    return true;
  const username = message.from.username;
  const isValid = usernames.indexOf(username) > -1;
  console.log('check result for user: ' + username + '. isValid: ' + isValid);
  return isValid;
}


let period1 = {id: 0, name: "Сейчас"};
let period2 = {id: 5, name: "Вчера"};
let period3 = {id: 6, name: "Прогноз"};

let periods = [period2, period1, period3];

function sendInitMessage(chatId) {
  bot.sendMessage(chatId, 'Можно узнать температуру', {
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

function isForecast(period) {
  return period.id === period3.id;
}

async function sendNowPictures(repository, chatId) {
  let currentDHT = await repository.getDHT();

  let time = formatDate(currentDHT.timestamp);
  let chartsData = dht.getBarChartData(currentDHT.data);

  for (const data of chartsData) {
    let image = await chart.buffer(data);
    bot.sendPhoto(chatId, image, {caption: 'График на момент ' + time})
  }
}

async function sendYesterdayPictures(repository, chatId) {
  let yesterday = new Date(repository.getCurrentDate().getTime() - 24 * 60 * 60 * 1000);
  let title = _.map([yesterday.getDate(), yesterday.getMonth(), yesterday.getFullYear()], normalizeNum).join('-');
  let yesterdayDHT = await repository.getDHTForDay();
  let charts = dht.getLineChartData(yesterdayDHT, title);

  for (const c of charts) {
    let i = await chart.buffer(c);
    bot.sendPhoto(chatId, i, {caption: 'График за вчера ( ' + title + ' )'});
  }

}

function sendForecastMessage(weatherService, chatId) {
  weatherService.getForecast()
    .then(forecast => {
      const head = 'Прогноз погоды на 10 дней от [Яндекса](https://yandex.ru/pogoda)';
      const body = _.map(forecast, item => {
        return '*' + item.date + '(' + item.dayOfWeek + ')*\t\t\t`' + item.day + '/' + item.night + '\t\t' + item.desc + '`'
      });


      bot.sendMessage(chatId, [head, body.join('\n\n')].join('\n\n'), {
        parse_mode: "markdown"
      });
    });

}

module.exports = function (repository, weatherService) {

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (isValidMessage(msg)) {

      let period = _.find(periods, p => p.name === msg.text);
      if (period) {
        if (isNow(period)) {
          sendNowPictures(repository, chatId);
        } else if (isYesterday(period)) {
          sendYesterdayPictures(repository, chatId);
        } else if (isForecast(period)) {
          sendForecastMessage(weatherService, chatId)
        } else {
          bot.sendMessage(chatId, "Еще в разработки, ожидайте позже");
          sendInitMessage(chatId);
        }
      } else {
        sendInitMessage(chatId);
      }

    }
  });
};
