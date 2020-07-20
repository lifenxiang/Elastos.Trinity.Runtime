const fs = require('fs')
const webpack = require("webpack") 

console.log("START - webpack.main.config.js");

module.exports = {
  mode: 'development',
  entry: `${__dirname}/../../platform_src/electron/main/index.ts`,
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
  // TypeORM / Sqlite3: don't try to embed optional dependencies with webpack, otherwise we get many build errors.
  externals: {
    'aws-sdk' :true,
    'mysql2' : true
  },
  plugins: [
    // For Sql.JS
    new webpack.NormalModuleReplacementPlugin(/typeorm$/, function (result) {
        result.request = result.request.replace(/typeorm/, "typeorm/browser");
    }),
    // For Sql.JS
    new webpack.ProvidePlugin({
      'window.SQL': 'sql.js/dist/sql-wasm.js'
    })
]
};

// IMPORTANT: In case of sqlite3 drive missing not found by TypeORM when launching electron, need to rebuild electron
// with sqlite3. TODO: Probably need to add this step in the build process (plugin post install?).
// ./node_modules/.bin/electron-rebuild -w sqlite3 -p