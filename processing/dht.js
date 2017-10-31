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

const colors = {
    14: 'rgb(255, 99, 132)',
    12: "rgb(54, 162, 235)",
    13: "rgb(75, 192, 192)"
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
            return {content: fromFile(path + '/' + file)};
        });
        defer.resolve(processItems(items));
    });
    return defer.promise;
}

function fromFile(path) {
    return fs.readFileSync(path, {encoding: 'utf-8'});
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

    let chartOptions = {
        // plugins: {
        //     afterDraw: function (chart, easing) {
        //         let self = chart.config;
        //
        //         const chartInstance = chart.chart;
        //         let ctx = chartInstance.ctx;
        //         ctx.textAlign = 'center';
        //         ctx.fillStyle = "rgba(0, 0, 0, 1)";
        //         ctx.textBaseline = 'bottom';
        //
        //         self.data.datasets.forEach(function (dataset, i) {
        //             let meta = chartInstance.controller.getDatasetMeta(i);
        //             meta.data.forEach(function (bar, index) {
        //                 let data = dataset.data[index];
        //                 ctx.fillText(data, bar._model.x, bar._model.y - 5);
        //             });
        //         });
        //
        //     }
        // },
        responsive: true
    };

    let ctx = [
        {label: 'График Температуры', data: temps},
        {label: 'График Влажности', data: hums}];

    return _.map(ctx, c => {
        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: c.data,
                    label: c.label,
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
            options: chartOptions
        };
    });
}


function getLineChartData(data, title) {
    let lineChartData = [];

    let labels = undefined;
    let tempDatasets = [];
    let humDatasets = [];



    for (let pin in data) {

        let temps = _.sortBy(data[pin].t, 'time');
        let hums = _.sortBy(data[pin].h, 'time');
        labels = labels || _.map(temps, t => {
            let timeStr = repository.getLocalDate(new Date(t.time)).toISOString();
            return timeStr.substring(timeStr.indexOf('T') + 1, timeStr.length - 5);
        });


        tempDatasets.push({
            label: 'Температура датчика ' + pins[pin],
            backgroundColor: colors[pin],
            borderColor: colors[pin],
            data: _.map(temps, 'value'),
            fill: false,
            labels: labels
        });

        humDatasets.push({
            label: 'Влажность датчика ' + pins[pin],
            backgroundColor: colors[pin],
            borderColor: colors[pin],
            data: _.map(hums, 'value'),
            fill: false,
            labels: labels
        })

    }

    lineChartData.push({
        type: 'line',
        data: {
            labels: labels,
            datasets: tempDatasets
        },
        options: {
            plugins:{},
            responsive: true,
            title: {
                display: true,
                text: 'График Температуры ' + (title ? title : '')
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
    });

    lineChartData.push({
        type: 'line',
        data: {
            labels: labels,
            datasets: humDatasets
        },
        options: {
            plugins:{},
            responsive: true,
            title: {
                display: true,
                text: 'График Влажности ' + (title ? title : '')
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
    });


    return lineChartData;
}

module.exports = {
    getChartData: function () {
        return fromFolder('./processing/2017-10-30');
    },
    getBarChartData: getBarChartData,
    getLineChartData: getLineChartData
};