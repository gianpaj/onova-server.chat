// require and configure dotenv, will load vars in .env file in process.env
require('dotenv').config();

const DEFAULT_ENDPOINT = '/pusher/auth';

const {
  APP_ID,
  APP_KEY,
  APP_SECRET,
  CLUSTER,
  PORT,
  DEBUG,
  MONGO_URI,
} = process.env;
const ENDPOINT = process.env.ENDPOINT || DEFAULT_ENDPOINT;
const config = {
  APP_ID,
  APP_KEY,
  APP_SECRET,
  CLUSTER,
  PORT,
  DEBUG,
  ENDPOINT,
  MONGO_URI,
};

const requiredKeys = [
  'APP_ID',
  'APP_KEY',
  'APP_SECRET',
  'CLUSTER',
  'MONGO_URI',
];
requiredKeys.forEach(key => {
  if (!config[key]) throw new Error(getMissingKeyErrorString(key));
});

module.exports = config;

function getMissingKeyErrorString(keyName) {
  const errorStr =
    `Unable to find environment variable: ${keyName}! ` +
    `Did you remember to set the ${keyName} value in your .env file?`;
  return errorStr;
}
