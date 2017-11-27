const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');

//format:  lat=<some float value>&lon=<some float value>
const location = process.env.WEATHER_LOCATION;


function getForecast() {
    return axios.get(['https://yandex.ru/pogoda?', location].join())
        .then(response => {
            const $ = cheerio.load(response.data)
            const days = _.map($('.time.forecast-briefly__date'), d => d.children[0].data);
            const dayTemps = _.map($('.temp.forecast-briefly__temp.forecast-briefly__temp_day > .temp__value'), d => d.children[0].data);
            const nightTemps = _.map($('.temp.forecast-briefly__temp.forecast-briefly__temp_night > .temp__value'), d => d.children[0].data);
            const desctiptions = _.map($('.forecast-briefly__condition'), d => d.children[0].data)

            return _.map(_.zip(days, dayTemps, nightTemps, desctiptions), i => {
                return {
                    date: i[0],
                    day: i[1],
                    night: i[2],
                    desc: i[3]
                }
            })
        })
}


module.exports = {
    getForecast: getForecast
};