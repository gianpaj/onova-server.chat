// @flow

import Rx from 'rxjs/Rx';
import request from 'request';

export class ChatkitHelper {
  constructor(chatkitInstance, pushHelperInstance) {
    /**
     * @type Chatkit
     */
    this.chatkitInstance = chatkitInstance;

    /**
     * @type PushHelper
     */
    this.pushHelperInstance = pushHelperInstance;
  }

  getUsers(): Observable {
    return Rx.Observable.fromPromise(this.chatkitInstance.getUsers());
  }

  getRoomMessages(userId: string, roomId: number, limit: number): Observable {
    return Rx.Observable.fromPromise(
      this.chatkitInstance.getRoomMessages(userId, roomId, {
        limit: limit,
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
        const [
          _,
          apiVersion,
          location,
          instanceId,
        ] = this.chatkitInstance.instanceLocator.match(
          /^(v\d*):([a-z0-9]*):([a-f0-9\-]*)$/
        );
        request(
          'https://' +
            location +
            '.pusherplatform.io/services/chatkit_cursors/' +
            apiVersion +
            '/' +
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
              resolve(JSON.parse(body));
            } else {
              console.error('ERROR', error);
              reject(error);
            }
          }
        );
      })
    );
  }

  populateUsersWithRoomsAndMessages(users, messagesLimit) {
    return Rx.Observable.combineLatest(
      ...users.map(user =>
        Rx.Observable.fromPromise(this.chatkitInstance.getUserRooms(user.id))
          .do(rooms => (user.rooms = rooms))
          .flatMap(rooms => {
            if (rooms.length < 1) return Rx.Observable.of([]);

            Rx.Observable.combineLatest(
              ...rooms.map(room =>
                this.getRoomMessages(user.id, room.id, messagesLimit).do(
                  messages => (room.messages = messages)
                )
              )
            );
          })
          .map(() => user)
      )
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
        // Remove rooms that doesn't have any unread messages
        user.rooms = user.rooms
          .map(room => {
            room.messages = room.messages
              .filter(message => message.id > (user.cursors[room.id] || 0)) // Filter out messages that's unread
              .filter(
                message =>
                  message.id >
                  this.pushHelperInstance.getLastPushedMessage(user.id, room.id)
              );

            return room;
          })
          .filter(room => room.messages.length > 0);

        return user;
      })
      .filter(user => {
        return user.rooms.length > 0;
      });
  }
}
