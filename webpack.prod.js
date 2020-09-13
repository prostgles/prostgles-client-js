const path = require('path');

module.exports = {
  entry: {
   'index': './lib/prostgles-full.ts',
   'index.no-sync': './lib/prostgles.ts'
  },
  mode: 'production',
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
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
};