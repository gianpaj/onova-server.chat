// Run this once.
// It's to set up a global role that users in Pusher ChatKit will have
// It's allowing to send messages, etc. but not delete a room, or kick others out.

import Sendbird from 'sendbird-platform-api';

const env = require('./config.js');

const sb = Sendbird(env.SENDBIRD_KEY);

async function sendAdminMessage(userIDA, userIDB) {
  // const { bots } = await sb.bots.list();
  // console.log(bots);
  // if (!bots.length) {
  //   console.log('not bots, creating one');

  //   const res = await sb.bots.create({
  //     bot_userid: '5bd1f7af46c62e6cdee546d0',
  //     bot_nickname: 'onova-drop',
  //     bot_profile_url: '',
  //     bot_callback_url: 'http://localhost',
  //     is_privacy_mode: true,
  //     channel_invitation_preference: 1, // automatically join after invitation
  //   });
  //   console.log(res);
  // }
  // update bot image
  // console.log(bots[0]);

  // sb.bots.join({
  //   bot_user_id: ONOVA_BOT_ID,
  //   channel_urls: [getRoomName(order)],
  // });

  // find a users channels
  const [userA, userB] = await Promise.all([
    sb.users.myGroupChannelList(userIDA, { limit: 100 }),
    sb.users.myGroupChannelList(userIDB, { limit: 100 }),
  ]);
  // channels = channels.filter(c => c.member_state !== 'joined')

  const channels = userA.channels.filter(a => userB.channels.find(b => b.channel_url == a.channel_url));

  if (channels.length > 1) {
    console.log(channels);
    throw new Error('too many channels');
  }
  if (!channels.length) {
    console.log(channels);
    throw new Error('no channels found for both users');
  }
  try {
    const res = await sb.groupChannels.messages.send(channels[0].channel_url, {
      message_type: 'ADMM',
      message: ' order num...',
      send_push: true,
      dedup_id: '123',
    });
    console.log(res);
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

const gian = '5af9faca151df625830bbfe1';
const alex = '5afaa93daeeb1453812fc011';

sendAdminMessage(gian, alex);
