const repository = require('../repository/repository');
const fs = require('fs');
const _ = require('lodash');
const Q = require('q');
const chart = require('./chart.js')

function fromRepository() {
    let defer = Q.defer();
    repository.all().then(items => {
        let result = processItems(items);
        defer.resolve(result);
    });

    return defer.promise;
}

function fromFolder(path) {

    fs.readdir(path, (err, files) => {
        if(err) console.log(err)
        let items = _.map(files, file => { return {content: fs.readFileSync(path+'/'+file, {encoding: 'utf-8'})}; });
        processItems(items)
    })
}

function processItems (items) {
    let sensorData = {};
    _.forEach(items, function (item) {
        const data = JSON.parse(item.content);
        _.forEach(data, function(line){
            if (!sensorData[line.dht])
                sensorData[line.dht] = [];
            let measures = sensorData[line.dht];
            var timestamp = new Date(line.timestamp);
            measures.push({
                temperature: line.temperature,
                humidity: line.humidity,
                timestamp: line.timestamp,
                date: timestamp,
                time: timestamp.getTime()
            })
        });
    });


    for (var sensorId in sensorData) {
        let datasets = [];
        var data = sensorData[sensorId];
        var sortedData = _.orderBy(data, ['time'], ['desc'])

        let dataset = {
            label: 'Температура датчика ' + sensorId,
            backgroundColor: 'rgb(' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ')',
            data: _.map(sortedData, item => item.temperature),
            fill: false
        };

        datasets.push(dataset);

        dataset = {
                    label: 'Влажность датчика ' + sensorId,
                    backgroundColor: 'rgb(' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ')',
                    data: _.map(sortedData, item => item.humidity),
                    fill: false,
                    labels: _.map(sortedData, d => d.timestamp)
                };

        datasets.push(dataset);

        chart.draw({
                    type: 'line',
                    data: {
                        labels: _.map(sortedData, i => i.timestamp),
                        datasets: datasets
                    },
                    options: {
                        responsive: false,
                        title:{
                            display: true,
                            text:'График температуры и влажности'
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



}


fromFolder('./NodeMCU/2017-10-13')

