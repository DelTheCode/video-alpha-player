const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: isDev 
    ? path.join(__dirname, '/example/index.ts')
    : path.join(__dirname, '/src/index.ts'),
  output: {
    path: path.join(__dirname, isDev ? '/example/dist' : '/dist'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  plugins: isDev ? [
    new HtmlPlugin({
      template: path.join(__dirname, '/example/public/index.html')
    })
  ] : [
		new CleanWebpackPlugin()
	],
  devServer: {
    port: '4396',
    hot: true,
    static: [
			{
				directory: path.join(__dirname, '/example/dist')
			},
			{
				directory: path.join(__dirname, '/example/assets'),
				publicPath: '/assets',
			}
		]
  }
};