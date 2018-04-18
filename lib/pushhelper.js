'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.PushHelper = undefined;var _Rx = require('rxjs/Rx');var _Rx2 = _interopRequireDefault(_Rx);
var _request = require('request');var _request2 = _interopRequireDefault(_request);
var _nodePersist = require('node-persist');

var _config = require('./config.json');function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class PushHelper {
  constructor() {
    (0, _nodePersist.initSync)();
  }

  getNotificationFromUserObject(user) {
    const rooms = user.rooms.map(room => {
      room.messages.
      filter(
      message => message.id > this.getLastPushedMessage(user.id, room.id)).

      map(() => room);

      return room;
    });

    const unreadMessagesCount = rooms.reduce((unreadMessagesCarry, room) => {
      return unreadMessagesCarry + room.messages.length;
    }, 0);

    let text = null;
    let title = null;
    let roomIds = rooms.map(room => room.id);

    if (unreadMessagesCount === 1) {
      title = 'New message';
      text = rooms[0].name + ': ' + rooms[0].messages[0].text;
    } else if (rooms.length === 1) {
      title = 'Unread messages';
      text =
      rooms[0].name +
      ': ' +
      'You have ' +
      unreadMessagesCount +
      ' unread messages';
    } else {
      title = 'Unread messages';
      text = 'You have ' + unreadMessagesCount + ' unread messages';
    }

    rooms.forEach(room => {
      (0, _nodePersist.setItemSync)(user.id + ':' + room.id, room.messages[0].id);
    });

    text = text.replace(/[\s|\n|\r]{1,}/g, ' ');

    return {
      title: title,
      message: text,
      user_id: parseInt(user.id, 10),
      rooms: roomIds };

  }

  sendPushToUsers(users) {
    (0, _nodePersist.initSync)();

    let notifications = users.map(user =>
    this.getNotificationFromUserObject(user));


    notifications.forEach(notification => console.log(notification));

    return this.getAccessToken().flatMap(token =>
    _Rx2.default.Observable.fromPromise(
    new Promise((resolve, reject) => {
      (0, _request2.default)(
      _config.push.endpoint,
      {
        json: true,
        strictSSL: _config.push.strictSSL,
        body: {
          notifications: notifications },

        headers: {
          Authorization: 'Bearer ' + token.accessToken },

        method: 'POST' },

      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          return resolve();
        }
        reject([response, body]);
      });

    })));


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
      return _Rx2.default.Observable.of(this.token);
    }
    console.log('issuing a new access token');

    return this.issueNewToken();
  }

  /**
     * @param {Token} token
     * @returns {Observable<Token>}
     */
  refreshToken(token) {
    return _Rx2.default.Observable.fromPromise(
    new Promise((resolve, reject) => {
      (0, _request2.default)(
      _config.push.auth.endpoint,
      {
        json: true,
        strictSSL: _config.push.strictSSL,
        body: {
          client_id: _config.push.auth.clientId,
          client_secret: _config.push.auth.clientSecret,
          grant_type: _config.push.auth.refreshGrantType,
          refresh_token: token.refreshToken },

        method: 'POST' },

      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          return resolve(new Token(body));
        }
        console.log(error, response, body);
        reject(error);
      });

    })).

    catch(() => {
      console.log('refresh token failed!');
      return this.issueNewToken();
    }).
    do(token => this.token = token);
  }

  /**
     * @returns {Observable<Token>}
     */
  issueNewToken() {
    console.log('issueNewToken called');
    return _Rx2.default.Observable.fromPromise(
    new Promise((resolve, reject) => {
      (0, _request2.default)(
      _config.push.auth.endpoint,
      {
        json: true,
        strictSSL: _config.push.strictSSL,
        body: {
          client_id: _config.push.auth.clientId,
          client_secret: _config.push.auth.clientSecret,
          grant_type: _config.push.auth.grantType },

        method: 'POST' },

      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          return resolve(new Token(body));
        }
        console.error(error);
        reject(error);
      });

    })).
    do(token => this.token = token);
  }

  getLastPushedMessage(userId, roomId) {
    return (0, _nodePersist.getItemSync)(userId + ':' + roomId) || 0;
  }}exports.PushHelper = PushHelper;


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
  }}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3B1c2hoZWxwZXIuanMiXSwibmFtZXMiOlsiUHVzaEhlbHBlciIsImNvbnN0cnVjdG9yIiwiZ2V0Tm90aWZpY2F0aW9uRnJvbVVzZXJPYmplY3QiLCJ1c2VyIiwicm9vbXMiLCJtYXAiLCJyb29tIiwibWVzc2FnZXMiLCJmaWx0ZXIiLCJtZXNzYWdlIiwiaWQiLCJnZXRMYXN0UHVzaGVkTWVzc2FnZSIsInVucmVhZE1lc3NhZ2VzQ291bnQiLCJyZWR1Y2UiLCJ1bnJlYWRNZXNzYWdlc0NhcnJ5IiwibGVuZ3RoIiwidGV4dCIsInRpdGxlIiwicm9vbUlkcyIsIm5hbWUiLCJmb3JFYWNoIiwicmVwbGFjZSIsInVzZXJfaWQiLCJwYXJzZUludCIsInNlbmRQdXNoVG9Vc2VycyIsInVzZXJzIiwibm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbiIsImNvbnNvbGUiLCJsb2ciLCJnZXRBY2Nlc3NUb2tlbiIsImZsYXRNYXAiLCJ0b2tlbiIsIk9ic2VydmFibGUiLCJmcm9tUHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZW5kcG9pbnQiLCJqc29uIiwic3RyaWN0U1NMIiwiYm9keSIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwiYWNjZXNzVG9rZW4iLCJtZXRob2QiLCJlcnJvciIsInJlc3BvbnNlIiwic3RhdHVzQ29kZSIsImZ1dHVyZURhdGUiLCJEYXRlIiwibm93IiwiZXhwaXJlc0F0IiwicmVmcmVzaFRva2VuIiwib2YiLCJpc3N1ZU5ld1Rva2VuIiwiYXV0aCIsImNsaWVudF9pZCIsImNsaWVudElkIiwiY2xpZW50X3NlY3JldCIsImNsaWVudFNlY3JldCIsImdyYW50X3R5cGUiLCJyZWZyZXNoR3JhbnRUeXBlIiwicmVmcmVzaF90b2tlbiIsIlRva2VuIiwiY2F0Y2giLCJkbyIsImdyYW50VHlwZSIsInVzZXJJZCIsInJvb21JZCIsImRhdGEiLCJleHBpcmVzX2luIiwiYWNjZXNzX3Rva2VuIl0sIm1hcHBpbmdzIjoiMEdB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QUFDRDtBQUNEYixnQkFBUWtCLEtBQVIsQ0FBY0EsS0FBZDtBQUNBVCxlQUFPUyxLQUFQO0FBQ0QsT0FsQkg7O0FBb0JELEtBckJELENBREs7QUF1QkxvQixNQXZCSyxDQXVCRmxDLFNBQVUsS0FBS0EsS0FBTCxHQUFhQSxLQXZCckIsQ0FBUDtBQXdCRDs7QUFFRHJCLHVCQUFxQnlELE1BQXJCLEVBQTZCQyxNQUE3QixFQUFxQztBQUNuQyxXQUFPLDhCQUFZRCxTQUFTLEdBQVQsR0FBZUMsTUFBM0IsS0FBc0MsQ0FBN0M7QUFDRCxHQXJMcUIsQyxRQUFYckUsVSxHQUFBQSxVOzs7QUF3TGIsTUFBTWdFLEtBQU4sQ0FBWTtBQUNWOzs7QUFHQS9ELGNBQVlxRSxJQUFaLEVBQWtCO0FBQ2hCOzs7QUFHQSxTQUFLbEIsU0FBTCxHQUFpQixJQUFJRixJQUFKLENBQVNBLEtBQUtDLEdBQUwsS0FBYW1CLEtBQUtDLFVBQUwsR0FBa0IsSUFBeEMsQ0FBakI7O0FBRUE7OztBQUdBLFNBQUszQixXQUFMLEdBQW1CMEIsS0FBS0UsWUFBeEI7O0FBRUE7OztBQUdBLFNBQUtuQixZQUFMLEdBQW9CaUIsS0FBS1AsYUFBekI7QUFDRCxHQW5CUyIsImZpbGUiOiJwdXNoaGVscGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJ4IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgeyBpbml0U3luYywgc2V0SXRlbVN5bmMsIGdldEl0ZW1TeW5jIH0gZnJvbSAnbm9kZS1wZXJzaXN0JztcblxuaW1wb3J0IHsgcHVzaCB9IGZyb20gJy4vY29uZmlnLmpzb24nO1xuXG5leHBvcnQgY2xhc3MgUHVzaEhlbHBlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGluaXRTeW5jKCk7XG4gIH1cblxuICBnZXROb3RpZmljYXRpb25Gcm9tVXNlck9iamVjdCh1c2VyKSB7XG4gICAgY29uc3Qgcm9vbXMgPSB1c2VyLnJvb21zLm1hcChyb29tID0+IHtcbiAgICAgIHJvb20ubWVzc2FnZXNcbiAgICAgICAgLmZpbHRlcihcbiAgICAgICAgICBtZXNzYWdlID0+IG1lc3NhZ2UuaWQgPiB0aGlzLmdldExhc3RQdXNoZWRNZXNzYWdlKHVzZXIuaWQsIHJvb20uaWQpXG4gICAgICAgIClcbiAgICAgICAgLm1hcCgoKSA9PiByb29tKTtcblxuICAgICAgcmV0dXJuIHJvb207XG4gICAgfSk7XG5cbiAgICBjb25zdCB1bnJlYWRNZXNzYWdlc0NvdW50ID0gcm9vbXMucmVkdWNlKCh1bnJlYWRNZXNzYWdlc0NhcnJ5LCByb29tKSA9PiB7XG4gICAgICByZXR1cm4gdW5yZWFkTWVzc2FnZXNDYXJyeSArIHJvb20ubWVzc2FnZXMubGVuZ3RoO1xuICAgIH0sIDApO1xuXG4gICAgbGV0IHRleHQgPSBudWxsO1xuICAgIGxldCB0aXRsZSA9IG51bGw7XG4gICAgbGV0IHJvb21JZHMgPSByb29tcy5tYXAocm9vbSA9PiByb29tLmlkKTtcblxuICAgIGlmICh1bnJlYWRNZXNzYWdlc0NvdW50ID09PSAxKSB7XG4gICAgICB0aXRsZSA9ICdOZXcgbWVzc2FnZSc7XG4gICAgICB0ZXh0ID0gcm9vbXNbMF0ubmFtZSArICc6ICcgKyByb29tc1swXS5tZXNzYWdlc1swXS50ZXh0O1xuICAgIH0gZWxzZSBpZiAocm9vbXMubGVuZ3RoID09PSAxKSB7XG4gICAgICB0aXRsZSA9ICdVbnJlYWQgbWVzc2FnZXMnO1xuICAgICAgdGV4dCA9XG4gICAgICAgIHJvb21zWzBdLm5hbWUgK1xuICAgICAgICAnOiAnICtcbiAgICAgICAgJ1lvdSBoYXZlICcgK1xuICAgICAgICB1bnJlYWRNZXNzYWdlc0NvdW50ICtcbiAgICAgICAgJyB1bnJlYWQgbWVzc2FnZXMnO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aXRsZSA9ICdVbnJlYWQgbWVzc2FnZXMnO1xuICAgICAgdGV4dCA9ICdZb3UgaGF2ZSAnICsgdW5yZWFkTWVzc2FnZXNDb3VudCArICcgdW5yZWFkIG1lc3NhZ2VzJztcbiAgICB9XG5cbiAgICByb29tcy5mb3JFYWNoKHJvb20gPT4ge1xuICAgICAgc2V0SXRlbVN5bmModXNlci5pZCArICc6JyArIHJvb20uaWQsIHJvb20ubWVzc2FnZXNbMF0uaWQpO1xuICAgIH0pO1xuXG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvW1xcc3xcXG58XFxyXXsxLH0vZywgJyAnKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogdGl0bGUsXG4gICAgICBtZXNzYWdlOiB0ZXh0LFxuICAgICAgdXNlcl9pZDogcGFyc2VJbnQodXNlci5pZCwgMTApLFxuICAgICAgcm9vbXM6IHJvb21JZHMsXG4gICAgfTtcbiAgfVxuXG4gIHNlbmRQdXNoVG9Vc2Vycyh1c2Vycykge1xuICAgIGluaXRTeW5jKCk7XG5cbiAgICBsZXQgbm90aWZpY2F0aW9ucyA9IHVzZXJzLm1hcCh1c2VyID0+XG4gICAgICB0aGlzLmdldE5vdGlmaWNhdGlvbkZyb21Vc2VyT2JqZWN0KHVzZXIpXG4gICAgKTtcblxuICAgIG5vdGlmaWNhdGlvbnMuZm9yRWFjaChub3RpZmljYXRpb24gPT4gY29uc29sZS5sb2cobm90aWZpY2F0aW9uKSk7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRBY2Nlc3NUb2tlbigpLmZsYXRNYXAodG9rZW4gPT5cbiAgICAgIFJ4Lk9ic2VydmFibGUuZnJvbVByb21pc2UoXG4gICAgICAgIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICByZXF1ZXN0KFxuICAgICAgICAgICAgcHVzaC5lbmRwb2ludCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgICAgICAgc3RyaWN0U1NMOiBwdXNoLnN0cmljdFNTTCxcbiAgICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnM6IG5vdGlmaWNhdGlvbnMsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tlbi5hY2Nlc3NUb2tlbixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yLCByZXNwb25zZSwgYm9keSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycm9yICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVqZWN0KFtyZXNwb25zZSwgYm9keV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB7T2JzZXJ2YWJsZTxUb2tlbj59XG4gICAqL1xuICBnZXRBY2Nlc3NUb2tlbigpIHtcbiAgICBpZiAodGhpcy50b2tlbikge1xuICAgICAgLy8gSWYgdGhlIGFjY2VzcyB0b2tlbiBleHBpcmVzIHdpdGhpbiBmaXZlIHNlY29uZHMsIHdlIHdhbnQgdG8gcmVmcmVzaCBpdFxuICAgICAgY29uc3QgZnV0dXJlRGF0ZSA9IERhdGUubm93KCkgKyA1MDAwO1xuXG4gICAgICBpZiAodGhpcy50b2tlbi5leHBpcmVzQXQgPCBmdXR1cmVEYXRlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdhY2Nlc3MgdG9rZW4gZXhwaXJlZCwgcmVmcmVzaCBpdCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZWZyZXNoVG9rZW4odGhpcy50b2tlbik7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnYWxyZWFkeSBoYXZlIGEgdmFsaWQgYWNjZXNzIHRva2VuLCB1c2luZyBpdCcpO1xuICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUub2YodGhpcy50b2tlbik7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdpc3N1aW5nIGEgbmV3IGFjY2VzcyB0b2tlbicpO1xuXG4gICAgcmV0dXJuIHRoaXMuaXNzdWVOZXdUb2tlbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VG9rZW59IHRva2VuXG4gICAqIEByZXR1cm5zIHtPYnNlcnZhYmxlPFRva2VuPn1cbiAgICovXG4gIHJlZnJlc2hUb2tlbih0b2tlbikge1xuICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmZyb21Qcm9taXNlKFxuICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICByZXF1ZXN0KFxuICAgICAgICAgIHB1c2guYXV0aC5lbmRwb2ludCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgICAgc3RyaWN0U1NMOiBwdXNoLnN0cmljdFNTTCxcbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwdXNoLmF1dGguY2xpZW50SWQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHB1c2guYXV0aC5jbGllbnRTZWNyZXQsXG4gICAgICAgICAgICAgIGdyYW50X3R5cGU6IHB1c2guYXV0aC5yZWZyZXNoR3JhbnRUeXBlLFxuICAgICAgICAgICAgICByZWZyZXNoX3Rva2VuOiB0b2tlbi5yZWZyZXNoVG9rZW4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3IsIHJlc3BvbnNlLCBib2R5KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWVycm9yICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgPT09IDIwMCkge1xuICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShuZXcgVG9rZW4oYm9keSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IsIHJlc3BvbnNlLCBib2R5KTtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSlcbiAgICApXG4gICAgICAuY2F0Y2goKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygncmVmcmVzaCB0b2tlbiBmYWlsZWQhJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmlzc3VlTmV3VG9rZW4oKTtcbiAgICAgIH0pXG4gICAgICAuZG8odG9rZW4gPT4gKHRoaXMudG9rZW4gPSB0b2tlbikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtPYnNlcnZhYmxlPFRva2VuPn1cbiAgICovXG4gIGlzc3VlTmV3VG9rZW4oKSB7XG4gICAgY29uc29sZS5sb2coJ2lzc3VlTmV3VG9rZW4gY2FsbGVkJyk7XG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuZnJvbVByb21pc2UoXG4gICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHJlcXVlc3QoXG4gICAgICAgICAgcHVzaC5hdXRoLmVuZHBvaW50LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgICBzdHJpY3RTU0w6IHB1c2guc3RyaWN0U1NMLFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHB1c2guYXV0aC5jbGllbnRJZCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHVzaC5hdXRoLmNsaWVudFNlY3JldCxcbiAgICAgICAgICAgICAgZ3JhbnRfdHlwZTogcHVzaC5hdXRoLmdyYW50VHlwZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIChlcnJvciwgcmVzcG9uc2UsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyb3IgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKG5ldyBUb2tlbihib2R5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSlcbiAgICApLmRvKHRva2VuID0+ICh0aGlzLnRva2VuID0gdG9rZW4pKTtcbiAgfVxuXG4gIGdldExhc3RQdXNoZWRNZXNzYWdlKHVzZXJJZCwgcm9vbUlkKSB7XG4gICAgcmV0dXJuIGdldEl0ZW1TeW5jKHVzZXJJZCArICc6JyArIHJvb21JZCkgfHwgMDtcbiAgfVxufVxuXG5jbGFzcyBUb2tlbiB7XG4gIC8qKlxuICAgKiBAcGFyYW0gZGF0YVxuICAgKi9cbiAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtEYXRlfVxuICAgICAqL1xuICAgIHRoaXMuZXhwaXJlc0F0ID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIGRhdGEuZXhwaXJlc19pbiAqIDEwMDApO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLmFjY2Vzc1Rva2VuID0gZGF0YS5hY2Nlc3NfdG9rZW47XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMucmVmcmVzaFRva2VuID0gZGF0YS5yZWZyZXNoX3Rva2VuO1xuICB9XG59XG4iXX0=