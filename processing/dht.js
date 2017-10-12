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
    let temperature = []
    let content = _.map(items, function (item) {
        const data = JSON.parse(item.content);

        const lines = _.map(data, function(line){
            temperature.push(line.temperature)
            return line.temperature + '\t' + line.humidity + '\t' + item.path + '\t' + item.timestamp
        });
        return lines.join('\n')
    });

    temperature = _.take(temperature, 10)
    chart.draw({
            type: 'line',
            data: {
                datasets: [ {
                        label: "Температура",
                        data: temperature
                    }
                ]
            },
            options: {
                responsive: false,
                title:{
                    display: true,
                    text:'График температуры'
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
                            labelString: 'Температура'
                        }
                    }]
                }
            }
        })


    const toFile = content.join('\n');
    fs.writeFile('dht_content', toFile);
    return toFile
}


fromFolder('./NodeMCU/2017-10-11')

