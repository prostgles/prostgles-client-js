
const path = require('path');

module.exports = {
  entry: './lib/index.ts',
  devtool: 'inline-source-map',
  mode: 'development',
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
    filename: 'index.dev.js',
    path: path.resolve(__dirname, 'dist'),
  },
  watch: true,
  watchOptions:  {
    aggregateTimeout: 200,
    poll: 1000
  }
};