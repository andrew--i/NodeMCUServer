const ChartjsNode = require('chartjs-node');

module.exports = {
  draw: function (chartJsOptions, fileName) {
    // 600x600 canvas size
    var chartNode = new ChartjsNode(1024, 600);


    chartNode.on('beforeDraw', function (Chartjs) {
      Chartjs.defaults.global.defaultFontSize = 16;
      Chartjs.defaults.global.defaultFontStyle = 'bold';

    });
    return chartNode.drawChart(chartJsOptions)
      .then(() => {
        let result = chartNode.writeImageToFile('image/png', fileName);
        chartNode.destroy();
        return result;
      });
  },

  stream: function (chartJsOptions) {
    let chartNode = new ChartjsNode(1024, 600);

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
      Chartjs.pluginService.clear();

    });

    return chartNode.drawChart(chartJsOptions)
      .then(() => {
        return chartNode.getImageBuffer('image/png');
      }).then(r => {
        chartNode.destroy();
        return r;
      });
  }
}
