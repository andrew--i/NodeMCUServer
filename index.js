const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const app = express();
const repository = require('./repository/repository');
const weatherService = require('./service/yandex-weather');
const schedule = require('./schedule/calculate_yesterday');

schedule.schedule();

app.use(bodyParser.json());
app.use(morgan('short'));

//setup port
app.set('port', (process.env.PORT || 9999));

const bot = require('./bot/bot');
bot(repository, weatherService);

//init routes
const dhtRoute = require('./route/dht');
app.post('/dht', dhtRoute.post(repository));
app.get('/dht', dhtRoute.get(repository));

//start server
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});