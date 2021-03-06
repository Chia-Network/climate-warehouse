const path = require('path');
const jsConfig = require('./jsconfig.json');

module.exports = {
  include: [/src/, /node_modules/],
  presets: ['@babel/preset-env'],
  plugins: [
    [
      'module-resolver',
      {
        root: [path.resolve(jsConfig.compilerOptions.baseUrl)],
      },
    ],
  ],
};
