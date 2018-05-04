import Rx from 'rxjs/Rx';
import request from 'request';
import Agenda from 'agenda';
import { initSync, setItemSync, getItemSync } from 'node-persist';

const config = require('./config');

const JOBNAMES = {
  PUSH_MSG: 'send-push-msg', // person to person
};

import { push } from './config.json';

const agenda = new Agenda({
  db: {
    address: config.MONGO_URI,
    maxConcurrency: 2,
    defaultLockLifetime: 5000, // seconds
  },
});

export class PushHelper {
  constructor() {
    initSync();
  }

  getNotificationUsers(user, users) {
    const rooms = user.rooms.map(room => {
      room.messages
        .filter(
          message => message.id > this.getLastPushedMessage(user.id, room.id)
        )
        .map(() => room);

      return room;
    });

    const unreadMessagesCount = rooms.reduce((unreadMessagesCarry, room) => {
      return unreadMessagesCarry + room.messages.length;
    }, 0);

    let text = null;
    let title = null;
    // let roomIds = rooms.map(room => room.id);

    const partner = users.find(u => u.id !== rooms[0].messages[0].user_id);
    // debugger;
    // if (unreadMessagesCount === 1) {
    title = 'New message';
    text = rooms[0].messages[0].text;
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
      setItemSync(user.id + ':' + room.id, room.messages[0].id);
    });

    text = text.replace(/[\s|\n|\r]{1,}/g, ' ');

    return {
      id: rooms[0].messages[0].id,
      title,
      message: text,
      user_id: parseInt(user.id, 10),
      // rooms: roomIds,
      roomId: rooms[0].id,
      partner,
    };
  }

  sendPushToUsers(users) {
    initSync();

    let notifications = users.map(user =>
      this.getNotificationUsers(user, users)
    );

    //console.log('sendPushToUsers');
    const Promises = notifications.map(notification => {
      //console.log(notification);
      return new Promise((resolve, reject) => {
        const { title, message, partner, roomId } = notification;
        const pushData = {
          message,
          // title,
          // triggeredBy: sender._id,
          triggeredType: 'User',
          senderName: partner.name,
          targetUser: partner.id,
          roomId,
        };

        const job = agenda.create(JOBNAMES.PUSH_MSG, pushData);

        job.unique({ notification_id: notification.id });

        return job.save(err => {
          if (err) {
            const e = new Error(`Job failed with error: ${err}`);
            reject(e);
          }
        });
      });
    });

    return Rx.Observable.of(Promise.all(Promises)).flatMap(() =>
      Rx.Observable.fromPromise(
        new Promise((resolve, reject) => {
          return resolve();
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

  getLastPushedMessage(userId, roomId) {
    return getItemSync(userId + ':' + roomId) || 0;
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
