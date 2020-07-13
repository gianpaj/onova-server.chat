// require and configure dotenv, will load vars in .env file in process.env
require('dotenv').config();

const { DEBUG, MONGO_URI, SENDBIRD_KEY, SENDBIRD_URL } = process.env;
const config = {
  DEBUG: DEBUG == 'true',
  MONGO_URI,
  SENDBIRD_KEY,
  SENDBIRD_URL,
};

const requiredKeys = ['MONGO_URI', 'SENDBIRD_KEY', 'SENDBIRD_URL'];
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
