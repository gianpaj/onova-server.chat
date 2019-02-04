// @flow

import Rx from 'rxjs/Rx';
import request from 'request';
import Agenda from 'agenda';
const storage = require('node-persist');

import { JOBNAMES } from './util';

const config = require('./config');

import { push } from './config.json';

const ONOVA_BOT_ID = '5bd1f7af46c62e6cdee546d0';

const agenda = new Agenda({
  db: {
    address: config.MONGO_URI,
    maxConcurrency: 2,
    defaultLockLifetime: 5000, // seconds
  },
});

export class PushHelper {
  constructor() {
    storage.initSync();
    console.log('node-persist initiated');
  }

  getNotificationUsers(user) {
    const rooms = user.rooms.map(room => {
      room.messages
        .filter(
          message => message.id > this.getLastPushedMessage(user.id, room.id)
        )
        .map(() => room);

      return room;
    });

    // const unreadMessagesCount = rooms.reduce((unreadMessagesCarry, room) => {
    //   return unreadMessagesCarry + room.messages.length;
    // }, 0);

    // let title = null;
    const message = rooms[0].messages[0];

    // let roomIds = rooms.map(room => room.id);

    // const receiver = users.find(u => u.id !== message.user_id);
    // const receiver = rooms[0].member_user_ids.find(u => u !== message.user_id);

    // if (unreadMessagesCount === 1) {
    // title = 'New message';
    let text;

    if (message.attachment) {
      text = 'Photo';
    } else {
      // remove new lines
      text = message.text.replace(/[\s|\n|\r]{1,}/g, ' ');
    }
    // } else if (rooms.length === 1) {
    //   title = 'Unread messages';
    //   text =
    //     rooms[0].name +
    //     ': ' +
    //     'You have ' +
    //     unreadMessagesCount +
    //     ' unread messages';
    // } else {
    //   title = 'Unread messages';
    //   text = 'You have ' + unreadMessagesCount + ' unread messages';
    // }

    rooms.forEach(room => {
      storage.setItemSync(user.id + ':' + room.id, room.messages[0].id);
    });

    const receiver = rooms[0].member_user_ids.find(
      ids => ids !== message.user_id
    );

    return {
      id: message.id,
      created_at: message.created_at,
      message: text,
      roomId: rooms[0].id,
      receiver,
      senderId: message.user_id,
    };
  }

  sendPushToUsers(users) {
    storage.initSync();

    // console.log(users);
    const notifications = users
      .filter(u => u.id !== ONOVA_BOT_ID)
      .map(user => this.getNotificationUsers(user));

    // console.log(notifications);
    const Promises = notifications
      .filter(notif => notif.receiver !== notif.senderId)
      .map(notification => {
        // console.log(notification);
        return new Promise((resolve, reject) => {
          const {
            created_at,
            message,
            receiver,
            roomId,
            senderId,
          } = notification;
          const pushData = {
            message,
            created_at,
            triggeredBy: roomId.toString(),
            triggeredType: 'Room',
            // senderName: receiver.name,
            targetUser: receiver,
            senderId,
          };

          config.DEBUG && console.log(pushData);

          const job = agenda.create(JOBNAMES.PUSH_MSG, pushData);

          // check we're not sending double push notifications for System Notifications
          if (senderId === ONOVA_BOT_ID) {
            job.unique({
              message, // unique tracking number
              targetUser: receiver,
              triggeredBy: roomId.toString(),
            });
          } else {
            job.unique({ created_at, targetUser: receiver });
          }

          return job.save(err => {
            if (err) {
              const e = new Error(`Job failed with error: ${err}`);
              return reject(e);
            }
            resolve();
          });
        });
      });

    return Rx.Observable.of(Promise.all(Promises)).flatMap(() =>
      Rx.Observable.fromPromise(
        new Promise((resolve, reject) => {
          return resolve(Promises.length);
        })
      )
    );

    // return this.getAccessToken().flatMap(token =>
    //   Rx.Observable.fromPromise(
    //     new Promise((resolve, reject) => {
    //       request(
    //         push.endpoint,
    //         {
    //           json: true,
    //           strictSSL: push.strictSSL,
    //           body: {
    //             notifications: notifications,
    //           },
    //           headers: {
    //             Authorization: 'Bearer ' + token.accessToken,
    //           },
    //           method: 'POST',
    //         },
    //         (error, response, body) => {
    //           if (!error && response.statusCode === 200) {
    //             return resolve();
    //           }
    //           reject([response, body]);
    //         }
    //       );
    //     })
    //   )
    // );
  }

  /**
   * @returns {Observable<Token>}
   */
  getAccessToken() {
    if (this.token) {
      // If the access token expires within five seconds, we want to refresh it
      const futureDate = Date.now() + 5000;

      if (this.token.expiresAt < futureDate) {
        console.log('access token expired, refresh it');
        return this.refreshToken(this.token);
      }
      console.log('already have a valid access token, using it');
      return Rx.Observable.of(this.token);
    }
    console.log('issuing a new access token');

    return this.issueNewToken();
  }

  /**
   * @param {Token} token
   * @returns {Observable<Token>}
   */
  refreshToken(token) {
    return Rx.Observable.fromPromise(
      new Promise((resolve, reject) => {
        request(
          push.auth.endpoint,
          {
            json: true,
            strictSSL: push.strictSSL,
            body: {
              client_id: push.auth.clientId,
              client_secret: push.auth.clientSecret,
              grant_type: push.auth.refreshGrantType,
              refresh_token: token.refreshToken,
            },
            method: 'POST',
          },
          (error, response, body) => {
            if (!error && response.statusCode === 200) {
              return resolve(new Token(body));
            }
            console.log(error, response, body);
            reject(error);
          }
        );
      })
    )
      .catch(() => {
        console.log('refresh token failed!');
        return this.issueNewToken();
      })
      .do(token => (this.token = token));
  }

  /**
   * @returns {Observable<Token>}
   */
  issueNewToken() {
    return Rx.Observable.fromPromise(
      new Promise((resolve, reject) => {
        request(
          push.auth.endpoint,
          {
            json: true,
            strictSSL: push.strictSSL,
            body: {
              client_id: push.auth.clientId,
              client_secret: push.auth.clientSecret,
              grant_type: push.auth.grantType,
            },
            method: 'POST',
          },
          (error, response, body) => {
            if (!error && response.statusCode === 200) {
              return resolve(new Token(body));
            }
            console.error(error);
            reject(error);
          }
        );
      })
    ).do(token => (this.token = token));
  }

  getLastPushedMessage(userId, roomId): Promise<any> {
    return storage.getItemSync(userId + ':' + roomId) || 0;
  }
}

class Token {
  /**
   * @param data
   */
  constructor(data) {
    /**
     * @type {Date}
     */
    this.expiresAt = new Date(Date.now() + data.expires_in * 1000);

    /**
     * @type {string}
     */
    this.accessToken = data.access_token;

    /**
     * @type {string}
     */
    this.refreshToken = data.refresh_token;
  }
}
