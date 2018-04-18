'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.ChatkitHelper = undefined;

var _Rx = require('rxjs/Rx');var _Rx2 = _interopRequireDefault(_Rx);
var _request = require('request');var _request2 = _interopRequireDefault(_request);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class ChatkitHelper {
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

  getUsers() {
    return _Rx2.default.Observable.fromPromise(this.chatkitInstance.getUsers());
  }

  getRoomMessages(userId, roomId, limit) {
    return _Rx2.default.Observable.fromPromise(
    this.chatkitInstance.getRoomMessages(userId, roomId, {
      limit: limit }));


  }

  /**
     * @param userId
     * @returns {Observable}
     */
  getUserCursors(userId) {
    return _Rx2.default.Observable.fromPromise(
    new Promise((resolve, reject) => {
      const [
      _,
      apiVersion,
      location,
      instanceId] =
      this.chatkitInstance.instanceLocator.match(
      /^(v\d*):([a-z0-9]*):([a-f0-9\-]*)$/);

      (0, _request2.default)(
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
          Authorization: 'Bearer ' + this.chatkitInstance.getServerToken() } },


      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          console.error('ERROR', error);
          reject(error);
        }
      });

    }));

  }

  populateUsersWithRoomsAndMessages(users, messagesLimit) {
    return _Rx2.default.Observable.combineLatest(
    ...users.map(user =>
    _Rx2.default.Observable.fromPromise(this.chatkitInstance.getUserRooms(user.id)).
    do(rooms => user.rooms = rooms).
    flatMap(rooms => {
      if (rooms.length < 1) return _Rx2.default.Observable.of([]);

      _Rx2.default.Observable.combineLatest(
      ...rooms.map(room =>
      this.getRoomMessages(user.id, room.id, messagesLimit).do(
      messages => room.messages = messages)));



    }).
    map(() => user)));


  }

  populateUsersWithCursors(users) {
    return _Rx2.default.Observable.combineLatest(
    ...users.map(user =>
    this.getUserCursors(user.id).
    do(cursors => {
      user.cursors = {};

      for (const x in cursors) {
        if (cursors.hasOwnProperty(x)) {
          user.cursors[cursors[x].room_id] = cursors[x].position;
        }
      }
    }).
    map(() => user)));


  }

  /**
     * @param users
     */
  filterUsersRoomsAndMessages(users) {
    return users.
    map(user => {
      // Remove rooms that doesn't have any unread messages
      user.rooms = user.rooms.
      map(room => {
        room.messages = room.messages.
        filter(message => message.id > (user.cursors[room.id] || 0)) // Filter out messages that's unread
        .filter(
        message =>
        message.id >
        this.pushHelperInstance.getLastPushedMessage(user.id, room.id));


        return room;
      }).
      filter(room => room.messages.length > 0);

      return user;
    }).
    filter(user => {
      return user.rooms.length > 0;
    });
  }}exports.ChatkitHelper = ChatkitHelper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NoYXRraXRoZWxwZXIuanMiXSwibmFtZXMiOlsiQ2hhdGtpdEhlbHBlciIsImNvbnN0cnVjdG9yIiwiY2hhdGtpdEluc3RhbmNlIiwicHVzaEhlbHBlckluc3RhbmNlIiwiZ2V0VXNlcnMiLCJPYnNlcnZhYmxlIiwiZnJvbVByb21pc2UiLCJnZXRSb29tTWVzc2FnZXMiLCJ1c2VySWQiLCJyb29tSWQiLCJsaW1pdCIsImdldFVzZXJDdXJzb3JzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJfIiwiYXBpVmVyc2lvbiIsImxvY2F0aW9uIiwiaW5zdGFuY2VJZCIsImluc3RhbmNlTG9jYXRvciIsIm1hdGNoIiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJnZXRTZXJ2ZXJUb2tlbiIsImVycm9yIiwicmVzcG9uc2UiLCJib2R5Iiwic3RhdHVzQ29kZSIsIkpTT04iLCJwYXJzZSIsImNvbnNvbGUiLCJwb3B1bGF0ZVVzZXJzV2l0aFJvb21zQW5kTWVzc2FnZXMiLCJ1c2VycyIsIm1lc3NhZ2VzTGltaXQiLCJjb21iaW5lTGF0ZXN0IiwibWFwIiwidXNlciIsImdldFVzZXJSb29tcyIsImlkIiwiZG8iLCJyb29tcyIsImZsYXRNYXAiLCJsZW5ndGgiLCJvZiIsInJvb20iLCJtZXNzYWdlcyIsInBvcHVsYXRlVXNlcnNXaXRoQ3Vyc29ycyIsImN1cnNvcnMiLCJ4IiwiaGFzT3duUHJvcGVydHkiLCJyb29tX2lkIiwicG9zaXRpb24iLCJmaWx0ZXJVc2Vyc1Jvb21zQW5kTWVzc2FnZXMiLCJmaWx0ZXIiLCJtZXNzYWdlIiwiZ2V0TGFzdFB1c2hlZE1lc3NhZ2UiXSwibWFwcGluZ3MiOiI7O0FBRUEsNkI7QUFDQSxrQzs7QUFFTyxNQUFNQSxhQUFOLENBQW9CO0FBQ3pCQyxjQUFZQyxlQUFaLEVBQTZCQyxrQkFBN0IsRUFBaUQ7QUFDL0M7OztBQUdBLFNBQUtELGVBQUwsR0FBdUJBLGVBQXZCOztBQUVBOzs7QUFHQSxTQUFLQyxrQkFBTCxHQUEw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Q0FBdkIsQ0FBSixFQUErQjtBQUM3QlosZUFBS1csT0FBTCxDQUFhQSxRQUFRQyxDQUFSLEVBQVdFLE9BQXhCLElBQW1DSCxRQUFRQyxDQUFSLEVBQVdHLFFBQTlDO0FBQ0Q7QUFDRjtBQUNGLEtBVEg7QUFVR2hCLE9BVkgsQ0FVTyxNQUFNQyxJQVZiLENBREMsQ0FERSxDQUFQOzs7QUFlRDs7QUFFRDs7O0FBR0FnQiw4QkFBNEJwQixLQUE1QixFQUFtQztBQUNqQyxXQUFPQTtBQUNKRyxPQURJLENBQ0FDLFFBQVE7QUFDWDtBQUNBQSxXQUFLSSxLQUFMLEdBQWFKLEtBQUtJLEtBQUw7QUFDVkwsU0FEVSxDQUNOUyxRQUFRO0FBQ1hBLGFBQUtDLFFBQUwsR0FBZ0JELEtBQUtDLFFBQUw7QUFDYlEsY0FEYSxDQUNOQyxXQUFXQSxRQUFRaEIsRUFBUixJQUFjRixLQUFLVyxPQUFMLENBQWFILEtBQUtOLEVBQWxCLEtBQXlCLENBQXZDLENBREwsRUFDZ0Q7QUFEaEQsU0FFYmUsTUFGYTtBQUdaQztBQUNFQSxnQkFBUWhCLEVBQVI7QUFDQSxhQUFLbkMsa0JBQUwsQ0FBd0JvRCxvQkFBeEIsQ0FBNkNuQixLQUFLRSxFQUFsRCxFQUFzRE0sS0FBS04sRUFBM0QsQ0FMVSxDQUFoQjs7O0FBUUEsZUFBT00sSUFBUDtBQUNELE9BWFU7QUFZVlMsWUFaVSxDQVlIVCxRQUFRQSxLQUFLQyxRQUFMLENBQWNILE1BQWQsR0FBdUIsQ0FaNUIsQ0FBYjs7QUFjQSxhQUFPTixJQUFQO0FBQ0QsS0FsQkk7QUFtQkppQixVQW5CSSxDQW1CR2pCLFFBQVE7QUFDZCxhQUFPQSxLQUFLSSxLQUFMLENBQVdFLE1BQVgsR0FBb0IsQ0FBM0I7QUFDRCxLQXJCSSxDQUFQO0FBc0JELEdBcEl3QixDLFFBQWQxQyxhLEdBQUFBLGEiLCJmaWxlIjoiY2hhdGtpdGhlbHBlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBSeCBmcm9tICdyeGpzL1J4JztcbmltcG9ydCByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuXG5leHBvcnQgY2xhc3MgQ2hhdGtpdEhlbHBlciB7XG4gIGNvbnN0cnVjdG9yKGNoYXRraXRJbnN0YW5jZSwgcHVzaEhlbHBlckluc3RhbmNlKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUgQ2hhdGtpdFxuICAgICAqL1xuICAgIHRoaXMuY2hhdGtpdEluc3RhbmNlID0gY2hhdGtpdEluc3RhbmNlO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgUHVzaEhlbHBlclxuICAgICAqL1xuICAgIHRoaXMucHVzaEhlbHBlckluc3RhbmNlID0gcHVzaEhlbHBlckluc3RhbmNlO1xuICB9XG5cbiAgZ2V0VXNlcnMoKTogT2JzZXJ2YWJsZSB7XG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuZnJvbVByb21pc2UodGhpcy5jaGF0a2l0SW5zdGFuY2UuZ2V0VXNlcnMoKSk7XG4gIH1cblxuICBnZXRSb29tTWVzc2FnZXModXNlcklkOiBzdHJpbmcsIHJvb21JZDogbnVtYmVyLCBsaW1pdDogbnVtYmVyKTogT2JzZXJ2YWJsZSB7XG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuZnJvbVByb21pc2UoXG4gICAgICB0aGlzLmNoYXRraXRJbnN0YW5jZS5nZXRSb29tTWVzc2FnZXModXNlcklkLCByb29tSWQsIHtcbiAgICAgICAgbGltaXQ6IGxpbWl0LFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB1c2VySWRcbiAgICogQHJldHVybnMge09ic2VydmFibGV9XG4gICAqL1xuICBnZXRVc2VyQ3Vyc29ycyh1c2VySWQpIHtcbiAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShcbiAgICAgIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgW1xuICAgICAgICAgIF8sXG4gICAgICAgICAgYXBpVmVyc2lvbixcbiAgICAgICAgICBsb2NhdGlvbixcbiAgICAgICAgICBpbnN0YW5jZUlkLFxuICAgICAgICBdID0gdGhpcy5jaGF0a2l0SW5zdGFuY2UuaW5zdGFuY2VMb2NhdG9yLm1hdGNoKFxuICAgICAgICAgIC9eKHZcXGQqKTooW2EtejAtOV0qKTooW2EtZjAtOVxcLV0qKSQvXG4gICAgICAgICk7XG4gICAgICAgIHJlcXVlc3QoXG4gICAgICAgICAgJ2h0dHBzOi8vJyArXG4gICAgICAgICAgICBsb2NhdGlvbiArXG4gICAgICAgICAgICAnLnB1c2hlcnBsYXRmb3JtLmlvL3NlcnZpY2VzL2NoYXRraXRfY3Vyc29ycy8nICtcbiAgICAgICAgICAgIGFwaVZlcnNpb24gK1xuICAgICAgICAgICAgJy8nICtcbiAgICAgICAgICAgIGluc3RhbmNlSWQgK1xuICAgICAgICAgICAgJy9jdXJzb3JzLzAvdXNlcnMvJyArXG4gICAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0aGlzLmNoYXRraXRJbnN0YW5jZS5nZXRTZXJ2ZXJUb2tlbigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvciwgcmVzcG9uc2UsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyb3IgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZShib2R5KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFUlJPUicsIGVycm9yKTtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBwb3B1bGF0ZVVzZXJzV2l0aFJvb21zQW5kTWVzc2FnZXModXNlcnMsIG1lc3NhZ2VzTGltaXQpIHtcbiAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxuICAgICAgLi4udXNlcnMubWFwKHVzZXIgPT5cbiAgICAgICAgUnguT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZSh0aGlzLmNoYXRraXRJbnN0YW5jZS5nZXRVc2VyUm9vbXModXNlci5pZCkpXG4gICAgICAgICAgLmRvKHJvb21zID0+ICh1c2VyLnJvb21zID0gcm9vbXMpKVxuICAgICAgICAgIC5mbGF0TWFwKHJvb21zID0+IHtcbiAgICAgICAgICAgIGlmIChyb29tcy5sZW5ndGggPCAxKSByZXR1cm4gUnguT2JzZXJ2YWJsZS5vZihbXSk7XG5cbiAgICAgICAgICAgIFJ4Lk9ic2VydmFibGUuY29tYmluZUxhdGVzdChcbiAgICAgICAgICAgICAgLi4ucm9vbXMubWFwKHJvb20gPT5cbiAgICAgICAgICAgICAgICB0aGlzLmdldFJvb21NZXNzYWdlcyh1c2VyLmlkLCByb29tLmlkLCBtZXNzYWdlc0xpbWl0KS5kbyhcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzID0+IChyb29tLm1lc3NhZ2VzID0gbWVzc2FnZXMpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLm1hcCgoKSA9PiB1c2VyKVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICBwb3B1bGF0ZVVzZXJzV2l0aEN1cnNvcnModXNlcnMpIHtcbiAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxuICAgICAgLi4udXNlcnMubWFwKHVzZXIgPT5cbiAgICAgICAgdGhpcy5nZXRVc2VyQ3Vyc29ycyh1c2VyLmlkKVxuICAgICAgICAgIC5kbyhjdXJzb3JzID0+IHtcbiAgICAgICAgICAgIHVzZXIuY3Vyc29ycyA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHggaW4gY3Vyc29ycykge1xuICAgICAgICAgICAgICBpZiAoY3Vyc29ycy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgIHVzZXIuY3Vyc29yc1tjdXJzb3JzW3hdLnJvb21faWRdID0gY3Vyc29yc1t4XS5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLm1hcCgoKSA9PiB1c2VyKVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHVzZXJzXG4gICAqL1xuICBmaWx0ZXJVc2Vyc1Jvb21zQW5kTWVzc2FnZXModXNlcnMpIHtcbiAgICByZXR1cm4gdXNlcnNcbiAgICAgIC5tYXAodXNlciA9PiB7XG4gICAgICAgIC8vIFJlbW92ZSByb29tcyB0aGF0IGRvZXNuJ3QgaGF2ZSBhbnkgdW5yZWFkIG1lc3NhZ2VzXG4gICAgICAgIHVzZXIucm9vbXMgPSB1c2VyLnJvb21zXG4gICAgICAgICAgLm1hcChyb29tID0+IHtcbiAgICAgICAgICAgIHJvb20ubWVzc2FnZXMgPSByb29tLm1lc3NhZ2VzXG4gICAgICAgICAgICAgIC5maWx0ZXIobWVzc2FnZSA9PiBtZXNzYWdlLmlkID4gKHVzZXIuY3Vyc29yc1tyb29tLmlkXSB8fCAwKSkgLy8gRmlsdGVyIG91dCBtZXNzYWdlcyB0aGF0J3MgdW5yZWFkXG4gICAgICAgICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9PlxuICAgICAgICAgICAgICAgICAgbWVzc2FnZS5pZCA+XG4gICAgICAgICAgICAgICAgICB0aGlzLnB1c2hIZWxwZXJJbnN0YW5jZS5nZXRMYXN0UHVzaGVkTWVzc2FnZSh1c2VyLmlkLCByb29tLmlkKVxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gcm9vbTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5maWx0ZXIocm9vbSA9PiByb29tLm1lc3NhZ2VzLmxlbmd0aCA+IDApO1xuXG4gICAgICAgIHJldHVybiB1c2VyO1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIodXNlciA9PiB7XG4gICAgICAgIHJldHVybiB1c2VyLnJvb21zLmxlbmd0aCA+IDA7XG4gICAgICB9KTtcbiAgfVxufVxuIl19