// Run this once.
// It's to set up a global role that users in Pusher ChatKit will have
// It's allowing to send messages, etc. but not delete a room, or kick others out.

const Chatkit = require('@pusher/chatkit-server');

const config = require('./config.json');

const ckInst = new Chatkit.default({
  instanceLocator: config.chatkit.instanceLocator,
  key: config.chatkit.key,
});

ckInst
  .updatePermissionsForGlobalRole({
    roleName: 'default',
    permissionsToAdd: [
      // 'room:members:add',
      // 'room:members:remove',
      'cursors:read:get',
      'cursors:read:set',
      'file:create',
      'file:get',
      'message:create',
      'presence:subscribe',
      'room:create',
      // 'room:delete',
      'room:get',
      'room:join',
      // 'room:leave',
      'room:messages:get',
      'room:typing_indicator:create',
      'room:update',
      'user:get',
      'user:rooms:get',
    ],
  })
  .then(() => {
    console.log('updatePermissionsForGlobalRole Success');
  });
