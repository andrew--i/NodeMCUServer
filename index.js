const express = require('express');
const bodyParser = require('body-parser')
const morgan = require('morgan');
const app = express();
const repository = require('./repository/repository')

app.use(bodyParser.json());
app.use(morgan('short'));

//setup port
app.set('port', (process.env.PORT || 9999));

//init routes
const dhtRoute = require('./route/dht');
app.post('/dht', dhtRoute.post(repository));
app.get('/dht', (req, res) => res.send("hello world!!!"));

//start server
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});