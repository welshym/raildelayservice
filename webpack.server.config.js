const path = require("path")
const fs = require("fs")
const base = path.join(__dirname, './');
const src = path.join(base, 'src');
const test = path.join(base, 'test');
const webpack = require('webpack');

// -- Webpack configuration --
module.exports = function (options) {
  options = options || {};
  const config = {
    // We build for node
    target: "node",

    // Node module dependencies should not be bundled
    externals: fs.readdirSync("node_modules")
      .reduce(function(acc, mod) {
        if (mod === ".bin") {
          return acc
        }

        acc[mod] = "commonjs " + mod
        return acc
    }, {}),

    // We are outputting a real node app!
    node: {
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: false,
      __dirname: false,
    },

    resolve: {
      extensions: [
        ".js",
        ".json",
      ],
    },

    module: {
      rules: [
          {
          enforce: "pre",
          test: /\.js?$/,
          exclude: /(node_modules)/,
          loader: 'eslint-loader',
          include: src,
          options: {
//            formatter: require('eslint-friendly-formatter'),
            emitWarning: true,
            emitError: true,
            failOnWarning: false,
            failOnError: false,
            useEslintrc: false,
            // configFile: path.join(__dirname, "eslint_conf.js")
            configFile: ".eslintrc"
          }}, {
          test: /\.js/,
          exclude: /(node_modules)/,          
          loader: 'babel-loader',
          include: src
        }]
    },      
  }
    
  return config;
};

/*, {
          test: /\.(css|less)$/,
          loader: 'style!css!less?strictMath'
        }, {
          test: /\.(png|jpg|woff2|woff|eot|ttf|svg)$/,
          loader: 'file?name=assets/[name]-[hash].[ext]'
        }, {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'eslint',
          include: src
        }, {
          test: /\.json$/,
          loader: 'json'
        }*/