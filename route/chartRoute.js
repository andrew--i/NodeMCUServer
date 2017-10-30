const dht = require('../processing/dht');
const chart = require('../processing/chart');

module.exports = {
    get: function (repository) {
        return function (req, res) {
            dht.getChartData().then(r => {
                chart.stream(r[0]).then(i => {
                    res.setHeader("content-type", "image/png");
                    i.stream.pipe(res);
                })
            });
        }
    }
};