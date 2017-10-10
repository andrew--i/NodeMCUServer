const repository = require('../repository/repository');
const fs = require('fs');
const _ = require('lodash');

repository.all().then(function (items) {
    let content = _.map(items, function (item) {
        const data = JSON.parse(item.content);
        return data.temperature + '\t' + data.humidity + '\t' + item.path + '\t' + item.timestamp
    });


    const toFile = content.join('\n');
    fs.writeFile('dht_content', toFile)
});

