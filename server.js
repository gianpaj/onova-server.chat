// @flow

import Sendbird from 'sendbird-platform-api';
// import logger from 'morgan';
import Agenda from 'agenda';
import { createHash } from 'crypto';

import { JOBNAMES, debug } from './util';

const env = require('./config');

if (env.DEBUG) console.log('Debugging is enabled');
else console.log('Debugging is disabled');

// const ONOVA_BOT_ID = '5bd1f7af46c62e6cdee546d0';

const agenda = new Agenda({
  db: {
    address: env.MONGO_URI,
    maxConcurrency: 2,
    defaultLockLifetime: 5000, // seconds
  },
});

const sb = Sendbird(env.SENDBIRD_KEY);

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

    const channelUrl = await getChannelUrl(order);
    debug('adding onovabot to channelUrl:', channelUrl);

    // // make one user of the two add onovabot to the chat room Id
    // await sb.bots.join({
    //   bot_user_id: ONOVA_BOT_ID,
    //   channel_urls: [getRoomName(order)],
    // });
    // debug('onovabot added successfully');

    // sb.bots.sendMessage({
    //   bot_user_id: ONOVA_BOT_ID,
    //   message: message,
    //   channel_url: getRoomName(order),
    // });

    const res = await sendAdminMessage(message, channelUrl);

    console.log(res);

    debug(`admin msg sent: ${message}`);

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

async function getChannelUrl(order: Order): Promise<string> {
  // find a users channels
  const [userA, userB] = await Promise.all([
    sb.users.myGroupChannelList(order.buyer._id, { limit: 100 }),
    sb.users.myGroupChannelList(order.seller._id, { limit: 100 }),
  ]);

  const channels = userA.channels.filter(a => userB.channels.find(b => b.channel_url == a.channel_url));

  if (channels.length > 1) {
    console.log(channels);
    throw new Error('too many channels');
  }
  if (!channels.length) {
    console.log(channels);
    throw new Error('no channels found for both users');
  }
  return channels[0].channel_url;
}

async function sendAdminMessage(message: string, channelUrl: string): Promise<any> {
  try {
    const res = await sb.groupChannels.messages.send(channelUrl, {
      message_type: 'ADMM',
      message,
      send_push: true,
      dedup_id: generateHash(message),
    });
    console.log(res);
    return res;
  } catch (error) {
    if (error.error.code == 400202) {
      // "dedup_id" violates unique constraint.
      console.debug('same message already sent');
    } else {
      console.error(error);
      throw error;
    }
  }
}

function generateHash(text: string) {
  return createHash('md5')
    .update(text)
    .digest('hex');
}
