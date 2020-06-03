// @flow

import Rx from 'rxjs/Rx';

import ChatHelper from './chatkithelper';
import PushHelper from './pushhelper';

const env = require('./config');

if (env.DEBUG) console.log('Debugging is enabled');
else console.log('Debugging is disabled');

const chathelper = new ChatHelper(env.SENDBIRD_KEY);
const pushHelper = new PushHelper(chathelper);

Rx.Observable.merge(Rx.Observable.interval(env.POLLINGINTERVAL * 1000), Rx.Observable.of(null))
  .do(() => env.DEBUG && console.log('Launching new job'))
  // .do(() => console.time('timer'))
  .flatMap(() => chathelper.getUsers())
  .flatMap(users => {
    env.DEBUG && console.log(`Searching messages of ${users.length} users`);
    return chathelper.populateUsersWithRoomsAndMessages(users, env.MESSAGESTOLOAD);
  })
  // .flatMap(users => pushHelper.populateUsersWithCursors(users))
  // .map(users => pushHelper.filterUsersRoomsAndMessages(users))
  .do(users => env.DEBUG && console.log(`Should send push messages to ${users.length} users`))
  .filter(users => {
    // if (users.length === 0) {
    //   console.timeEnd('timer');
    // }

    return users.length > 0;
  })
  // .flatMap(users => pushHelper.sendPushToUsers(users))
  .do(x => console.log(`Completed scheduling ${x} push messages`))
  // .do(() => console.timeEnd('timer'))
  .subscribe();
