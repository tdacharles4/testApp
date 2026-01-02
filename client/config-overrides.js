const path = require('path');

module.exports = function override(config, env) {
  // Add support for PNG files
  config.module.rules.push({
    test: /\.(png|jpe?g|gif|svg)$/i,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      },
    ],
  });
  
  return config;
};