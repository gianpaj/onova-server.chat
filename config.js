// require and configure dotenv, will load vars in .env file in process.env
require('dotenv').config();

const { DEBUG, MONGO_URI, PORT, ENDPOINT } = process.env;
const config = {
  DEBUG,
  ENDPOINT: ENDPOINT || '/pusher/auth',
  MONGO_URI,
  PORT,
};

const requiredKeys = ['MONGO_URI', 'ENDPOINT'];
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
