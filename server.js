// @flow

import Sendbird from 'sendbird-platform-api';
// import logger from 'morgan';
import Agenda from 'agenda';
import { createHash } from 'crypto';

import { JOBNAMES, debug } from './util';
import type { OrderData } from './types';

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

const sb = Sendbird(env.SENDBIRD_KEY, env.SENDBIRD_URL);

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
  }: { data: { order: OrderData, message: string } } = job.attrs;

  try {
    // server.data should have created the room already

    // const channelUrl = await getChannelUrl(order);
    debug('sending a message to channelUrl:', order.channelUrl);

    await sendAdminMessage(message, order.channelUrl);

    debug(`admin msg sent: ${message}`);

    done();
  } catch (error) {
    console.error(error);
    done(error);
  }
});

async function sendAdminMessage(message: string, channelUrl: string): Promise<any> {
  try {
    const res = await sb.groupChannels.messages.send(channelUrl, {
      message_type: 'ADMM',
      message,
      send_push: true,
      dedup_id: generateHash(message),
    });
    debug(res);
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
