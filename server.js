// @flow

import express from 'express';
import bodyParser from 'body-parser';
import Chatkit from '@pusher/chatkit-server';
// import logger from 'morgan';

const config = require('./config');

const app = express();
const port = process.env.PORT || 8142;
const configJSON = require('./config.json');
const chatkit = new Chatkit({
  instanceLocator: configJSON.chatkit.instanceLocator,
  key: configJSON.chatkit.key,
});

const debug = (...args) => {
  if (config.DEBUG) console.log('debug::: ', ...args);
};

// Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post(config.ENDPOINT, (req, res, next) => {
  debug('received auth request');
  debug('req.body:', req.body);
  // Some logic to determine whether the user making the request has access to
  // the private channel
  // TODO: validate JWT token

  const { grant_type } = req.body;

  try {
    if (grant_type !== 'client_credentials') {
      throw new Error('Invalid request');
    }
    // const { token, avatarURL, username } = req.headers;
    const { user_id } = req.query;

    const auth = chatkit.authenticate({
      userId: user_id,
      authPayload: req.body,
    });
    console.log('authenticated', user_id);
    return res.json(auth);
  } catch (error) {
    return res.status(500).json({ ok: false, error });
  }
});

app.listen(port, () => {
  let msg;
  if (config.DEBUG) msg = '(DEBUG mode)';
  console.info('server started on port:', port, msg);
});
