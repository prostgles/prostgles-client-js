const path = require('path');

module.exports = {
  entry: {
   'prostgles': './lib/prostgles-full.ts',
   'prostgles.min': './lib/prostgles-full.ts',
   'prostgles.no-sync.min': './lib/prostgles.ts'
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