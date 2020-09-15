const path = require('path');

console.log("START - webpack.renderer.config.js");

module.exports = {
  mode: 'development',
  entry: `${__dirname}/../../platform_src/electron/renderer/Main.ts`,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'expose-loader',
          options: 'TrinityRenderer'
        }, {
          loader: 'ts-loader'
        }],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: "trinity-renderer.js",
    path: `${__dirname}/../../platforms/electron/platform_www`
  },
  target: 'electron-renderer',
  node: {
    __dirname: false,
  },
};