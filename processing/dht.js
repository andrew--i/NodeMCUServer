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
            label: 'Влажность датчика ' + pins[sensorId],
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
        })
    }

    return chartData;
}


function getBarChartData(data) {

    let labels = [];
    let temps = [];
    let hums = [];

    for (let pin in pins) {
        let pData = _.find(data, d => d.dht === parseInt(pin));
        temps.push(parseFloat(pData.t));
        hums.push(parseFloat(pData.h));
        labels.push(pins[pin]);
    }

    chartData = [];

    chartData.push({
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data:temps,
                label: 'График температуры',
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)'

                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            scales: {
                yAxes: [{ticks: {mirror: true}}]
            }
        }

    });


    chartData.push({
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data:hums,
                label: 'График Влажности',
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)'

                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            scales: {
                yAxes: [{ticks: {mirror: true}}]
            }
        }

    });

    return chartData;
}


module.exports = {
    getChartData: function () {
        return fromFolder('./processing/2017-10-30');
    },

    getBarChartData: getBarChartData
};