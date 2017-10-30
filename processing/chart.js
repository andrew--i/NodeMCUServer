const ChartjsNode = require('chartjs-node');

module.exports = {
    draw: function (chartJsOptions, fileName) {
        // 600x600 canvas size
        var chartNode = new ChartjsNode(2600, 600);
        return chartNode.drawChart(chartJsOptions)
            .then(() => {
                let result = chartNode.writeImageToFile('image/png', fileName);
                chartNode.destroy();
                return result;
            });
    },

    stream: function (chartJsOptions) {
        let chartNode = new ChartjsNode(2600, 600);

        return chartNode.drawChart(chartJsOptions)
            .then(() => {
                let result = chartNode.getImageStream('image/png');
                chartNode.destroy();
                return result;
            });
    },

    buffer: function (chartJsOptions) {
        let chartNode = new ChartjsNode(800, 600);

        chartNode.on('beforeDraw', function (Chartjs) {
            Chartjs.defaults.global.defaultFontSize = 16;
            Chartjs.defaults.global.defaultFontStyle = 'bold';

            //Chartjs.defaults
            //Chartjs.pluginService
            //Chartjs.scaleService
            //Chartjs.layoutService
            //Chartjs.helpers
            //Chartjs.controllers
            //etc
        });

        return chartNode.drawChart(chartJsOptions)
            .then(() => {
                let result = chartNode.getImageBuffer('image/png');
                chartNode.destroy();
                return result;
            });
    }
}
