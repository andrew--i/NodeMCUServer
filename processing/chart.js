const ChartjsNode = require('chartjs-node');

module.exports = {
    draw: function(chartJsOptions) {
        // 600x600 canvas size
        var chartNode = new ChartjsNode(1024, 1024);
        return chartNode.drawChart(chartJsOptions)
        .then(() => {
           let result = chartNode.writeImageToFile('image/png', './testimage.png');
           chartNode.destroy();
           return result;
        });
    }
}
