# chatkit-push-helper

https://github.com/gildebrand/chatkit-push-helper

## helpful stuff

```js
const Chatkit = require("pusher-chatkit-server");

const config = require("./config.json");

const ckInst = new Chatkit.default({
  instanceLocator: config.chatkit.instanceLocator,
  key: config.chatkit.key
});

ckInst
  .updatePermissionsForGlobalRole({
    roleName: "default",
    permissionsToAdd: [
      "message:create",
      "room:join",
      "room:get",
      "room:create",
      "room:messages:get",
      "room:typing_indicator:create",
      "presence:subscribe",
      "user:get",
      "user:rooms:get",
      "cursors:read:get",
      "cursors:read:set",
      "file:create",
      "file:get",
      "room:delete",
      "room:update"
    ]
  })
  .then(() => {
    console.log("updatePermissionsForGlobalRole Success");
  });

ckInst
  .getUserRooms({ userId: "5ac5ebcd939b7f1712b92baf" })
  .then(res => console.log(res))
  .catch(e => console.log(e));

ckInst
  .updateUser({
    id: "5ac5ebcd939b7f1712b92baf",
    avatarURL:
      "http://assets.onova.co/users/5ac5ebcd939b7f1712b92baf-1522921871772.jpg"
  })
  .then(res => console.log(res))
  .catch(e => console.log(e));

ckInst
  .getUsers()
  .then(res => console.log(res))
  .catch(e => console.log(e));

ckInst
  .getRoomMessages({ userId: "5ac5ebcd939b7f1712b92baf", roomId: 6899881 })
  .then(res => console.log(res))
  .catch(e => console.log(e));

// gets 20 users at the time
ckInst
  .getUsers()
  .then(res => console.log(res))
  .catch(e => console.log(e));

temp1.forEach(u =>
  ckInst
    .deleteUser({ userId: u.id })
    .then(res => console.log(res))
    .catch(e => console.log(e))
);
```
