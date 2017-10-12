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
    let avgTemperature = []
    let avgHumidity = []
    let labels = [];
    _.forEach(items, function (item) {
        const data = JSON.parse(item.content);
        let temperature = []
        let humidity = []
        _.forEach(data, function(line){
            temperature.push(line.temperature + 1)
            humidity.push(line.humidity - 1)
        });
        avgTemperature.push(_.mean(temperature));
        avgHumidity.push(_.mean(humidity));
        labels.push(item.timestamp)
    });

    chart.draw({
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Температура",
                        backgroundColor: 'rgb(255, 99, 132)',
                        data: avgTemperature,
                        fill: false
                    },
                    {
                        label: "Влажность",
                        backgroundColor: 'rgb(155, 199, 132)',
                        data: avgHumidity,
                        fill: false
                    }
                ]
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
        })

}


fromFolder('./NodeMCU/2017-10-11')

