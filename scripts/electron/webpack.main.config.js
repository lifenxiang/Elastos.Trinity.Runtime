const path = require('path');

module.exports = {
  mode: 'development',
  entry: `${__dirname}/../../platform_src/electron/main/Main.ts`,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: "cdv-electron-main.js",
    path: `${__dirname}/../../platforms/electron/platform_www`
  },
  target: 'electron-main',
  node: {
    __dirname: false,
  },
};