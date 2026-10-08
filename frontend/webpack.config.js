const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack');

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    // A new name whenever the code changes, so browsers never run a stale cached app
    filename: "bundle.[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      fs : false,
      util: require.resolve("util/"),
      request: false,
      stream: require.resolve("stream-browserify"),
      events: require.resolve("events/")
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"], 
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new webpack.DefinePlugin({
      "process.env.BACKEND_API_URL": JSON.stringify(
        process.env.BACKEND_API_URL || ""
      ),
    }),
  ],
  devServer: {
    static: path.join(__dirname, "public"),
    compress: true,
    port: 9000,
    // Local dev: forward API calls to a backend (default: the local one on 9001)
    proxy: [
      {
        context: ["/api"],
        target: process.env.DEV_API_TARGET || "http://localhost:9001",
        pathRewrite: process.env.DEV_API_TARGET ? {} : { "^/api": "" },
        changeOrigin: true,
      },
    ],
  },
};
