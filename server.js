// @flow

import express from 'express';
import bodyParser from 'body-parser';
import Chatkit from '@pusher/chatkit-server';
// import logger from 'morgan';
import Agenda from 'agenda';
import Util, { JOBNAMES } from './util';

const config = require('./config');
const ONOVA_BOT_ID = '5bd1f7af46c62e6cdee546d0';

const agenda = new Agenda({
  db: {
    address: config.MONGO_URI,
    maxConcurrency: 2,
    defaultLockLifetime: 5000, // seconds
  },
});

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
    return res.json(auth.body);
  } catch (error) {
    return res.status(500).json({ ok: false, error });
  }
});

app.listen(port, () => {
  let msg = '';
  if (config.DEBUG) msg = '(DEBUG mode)';
  console.info('server started on port:', port, msg);
});

agenda.on('complete', job => {
  debug(job.attrs.data);
  debug(`Job ${job.attrs.name} finished`);
});

agenda.on('fail', (err, job) => {
  console.error(`Job failed with error: ${err.message}`);

  console.error(job);
});

agenda.on('ready', () => {
  agenda.start();
});

agenda.on('error', () => {
  agenda.start();
});

// listen to SYSTEM_MSG jobs
agenda.define(JOBNAMES.SYSTEM_MSG, async (job: Agenda.Job<any>, done) => {
  const {
    data: { order, message },
  } = job.attrs;

  try {
    // the seller should have created the room already
    const sellerRooms = await chatkit.getUserRooms({ userId: order.seller });
    const allRooms = sellerRooms.filter(r => r.name == getRoomName(order));

    if (allRooms.length !== 1) {
      console.log(allRooms);
      throw new Error('error getting user rooms');
    }
    const roomId = allRooms[0].id;
    debug('adding onovabot to room id:', roomId);

    // make one user of the two add onovabot to the chat room Id
    await chatkit.apiRequest({
      method: 'PUT',
      path: `/rooms/${roomId}/users/add`,
      body: {
        user_ids: [ONOVA_BOT_ID],
      },
      jwt: chatkit.generateAccessToken({ userId: order.seller }).token,
    });
    debug('onovabot added successfully');

    // send system message
    await chatkit.apiRequest({
      method: 'POST',
      path: `/rooms/${roomId}/messages`,
      body: {
        text: message,
      },
      jwt: chatkit.generateAccessToken({ userId: ONOVA_BOT_ID }).token,
    });

    done();
  } catch (error) {
    console.error(error);
    done(error);
  }
});

function getRoomName(o: Order): string {
  let ids;
  if (o.buyer._id && o.seller._id) {
    ids = [o.buyer._id, o.seller._id];
  } else {
    ids = [o.buyer, o.seller];
  }
  return ids.sort().join('-');
}
