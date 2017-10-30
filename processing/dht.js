const repository = require('../repository/repository');
const fs = require('fs');
const _ = require('lodash');
const Q = require('q');

const pins =
    {
        14: "Улица",
        12: "Тамбур",
        13: "Нагреватель"
    };


function fromRepository() {
    let defer = Q.defer();
    repository.all().then(items => {
        let result = processItems(items);
        defer.resolve(result);
    });

    return defer.promise;
}

function fromFolder(path) {
    let defer = Q.defer();
    fs.readdir(path, (err, files) => {
        if (err) console.log(err)
        let items = _.map(files, file => {
            return {content: fs.readFileSync(path + '/' + file, {encoding: 'utf-8'})};
        });
        defer.resolve(processItems(items));
    });
    return defer.promise;
}

function processItems(items) {
    let sensorData = {};
    _.forEach(items, function (item) {
        const data = JSON.parse(item.content);
        _.forEach(data, function (line) {
            let timestamp = new Date(line.timestamp);
            _.forEach(line.data, d => {
                if (!sensorData[d.dht]) {
                    sensorData[d.dht] = [];
                }

                let measures = sensorData[d.dht];
                measures.push({
                    temperature: parseFloat(d.t),
                    humidity: parseFloat(d.h),
                    timestamp: line.timestamp,
                    date: timestamp,
                    time: timestamp.getTime()
                })
            });
        });
    });


    let chartData = [];

    for (let sensorId in sensorData) {
        let datasets = [];
        let data = sensorData[sensorId];
        let sortedData = _.orderBy(data, ['time']);

        let dataset = {
            label: 'Температура датчика ' + pins[sensorId],
            backgroundColor: 'rgb(' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ')',
            data: _.map(sortedData, item => item.temperature),
            fill: false
        };

        datasets.push(dataset);

        dataset = {
            label: 'Влажность датчика ' + sensorId,
            backgroundColor: 'rgb(' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ')',
            data: _.map(sortedData, item => item.humidity),
            fill: false,
            labels: _.map(sortedData, d => d.timestamp)
        };

        datasets.push(dataset);

        chartData.push({
            type: 'line',
            data: {
                labels: _.map(sortedData, i => i.timestamp),
                datasets: datasets
            },
            options: {
                responsive: false,
                title: {
                    display: true,
                    text: 'График температуры и влажности'
                },
                scales: {
                    xAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Время'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Значение'
                        }
                    }]
                }
            }
        }, 'dht_' + sensorId + '.png')
    }

    return chartData;
}


module.exports = {
    getChartData: function () {
        return fromFolder('./processing/2017-10-30');
    }
};