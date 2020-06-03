// @flow

import Rx from 'rxjs/Rx';
import request from 'request';
import Sendbird from 'sendbird-platform-api';

export default class SendbirdHelper {
  constructor(sendBirdAPIKey: string, pushHelperInstance) {
    /**
     * @type Sendbird
     */
    this.sb = Sendbird(sendBirdAPIKey);

    /**
     * @type PushHelper
     */
    this.pushHelperInstance = pushHelperInstance;
  }

  getUsers(): Observable {
    const promise = this.sb.users
      .list({
        limit: 10,
        active_mode: 'activated',
        show_bot: false,
      })
      .then(result => result.users);
    // this.chatkitInstance
    //   .getUsers()
    //   .then(a => console.log(a))
    //   .catch(e => console.error(e));
    return Rx.Observable.fromPromise(promise);
  }

  populateUsersWithRoomsAndMessages(users, messagesLimit) {
    return Rx.Observable.combineLatest(
      ...users.map(user =>
        Rx.Observable.fromPromise(this.sb.users.myGroupChannelList({ user_id: user.user_id }))
          .do(result => (user.channels = result.channels))
          .flatMap(channels => {
            if (channels.length < 1) return Rx.Observable.of([]);

            return Rx.Observable.combineLatest(
              ...channels.map(channel =>
                this.getRoomMessages(user.id, channel.id, messagesLimit).do(messages => (channel.messages = messages))
              )
            );
          })
          .map(() => user)
      )
    );
  }

  getRoomMessages(userId: string, roomId: number, limit: number): Observable {
    return Rx.Observable.fromPromise(
      this.chatkitInstance.getRoomMessages({
        userId,
        roomId,
        limit,
      })
    );
  }

  /**
   * @param userId
   * @returns {Observable}
   */
  getUserCursors(userId) {
    return Rx.Observable.fromPromise(
      new Promise((resolve, reject) => {
        const [_, __, location, instanceId] = this.chatkitInstance.instanceLocator.match(
          /^(v\d*):([a-z0-9]*):([a-f0-9\-]*)$/
        );
        request(
          'https://' +
            location +
            '.pusherplatform.io/services/chatkit_cursors/' +
            instanceId +
            '/cursors/0/users/' +
            userId,
          {
            headers: {
              Authorization: 'Bearer ' + this.chatkitInstance.getServerToken(),
            },
          },
          (error, response, body) => {
            if (!error && response.statusCode === 200) {
              return resolve(JSON.parse(body));
            }
            console.error('ERROR', error);
            console.error(JSON.parse(body));
            reject(error || body);
          }
        );
      })
    );
  }

  populateUsersWithCursors(users) {
    return Rx.Observable.combineLatest(
      ...users.map(user =>
        this.getUserCursors(user.id)
          .do(cursors => {
            user.cursors = {};

            for (const x in cursors) {
              if (cursors.hasOwnProperty(x)) {
                user.cursors[cursors[x].room_id] = cursors[x].position;
              }
            }
          })
          .map(() => user)
      )
    );
  }

  /**
   * @param users
   */
  filterUsersRoomsAndMessages(users) {
    return users
      .map(user => {
        // Remove rooms that don't have any unread messages
        user.rooms = user.rooms
          .map(room => {
            room.messages = room.messages
              // .filter(message => message.id > (user.cursors[room.id] || 0)) // Filter out messages that are read
              .filter(message => message.id > this.pushHelperInstance.getLastPushedMessage(user.id, room.id));

            return room;
          })
          .filter(room => room.messages.length > 0);

        return user;
      })
      .filter(user => user.rooms.length > 0);
  }
}
