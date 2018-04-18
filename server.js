import express from 'express';
import bodyParser from 'body-parser';
import Pusher from 'pusher';
import Chatkit from 'pusher-chatkit-server';
// import logger from 'morgan';

const config = require('./config');

const app = express();
const port = process.env.PORT | 3030;
const pusher = new Pusher({
  appId: config.APP_ID,
  key: config.APP_KEY,
  secret: config.APP_SECRET,
  cluster: config.CLUSTER,
  // encrypted: true
});

const configJSON = require('./config.json');
const chatkit = new Chatkit({
  instanceLocator: configJSON.chatkit.instanceLocator,
  key: configJSON.chatkit.key,
});

const debug = (...args) => {
  if (config.DEBUG) {
    console.log('debug::: ', ...args);
  }
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
  // ...
  // ...
  // ...
  // Extract the socket id and channel name from the request body
  //
  const { socket_id, channel_name, grant_type } = req.body;

  if (grant_type == 'client_credentials') {
    const { token } = req.headers;

    // TODO: validate JWT token
    const { user_id } = req.query;
    const auth = chatkit.authenticate({
      userId: user_id,
      authPayload: req.body,
    });
    return chatkit
      .createUser({
        id: user_id,
        name: 'Some name',
      })
      .then(() => {
        console.log(token);
        console.log(auth);
        return res.json(auth);
      })
      .catch(e => {
        if (e.error_type == 'services/chatkit/user_already_exists') {
          return res.json(auth);
        }
        res.status(500).json({
          ok: false,
          error: e,
        });
      });
  }

  let auth;

  if (/^presence-/.test(channel_name)) {
    // If the request is for a presence channel include some data about the user
    // in the call to authenticate
    const timestamp = new Date().toISOString();
    const presenceData = {
      user_id: `user-${timestamp}`,
      user_info: {
        name: 'Pusherino',
        twitter_id: '@pusher',
      },
    };
    auth = pusher.authenticate(socket_id, channel_name, presenceData);
  } else {
    auth = pusher.authenticate(socket_id, channel_name);
  }
  res.send(auth);
});

app.listen(port, () => {
  let msg = '';
  if (config.DEBUG) msg = '(DEBUG mode)';
  console.info(`server started on port ${port} ${msg}`);
});
