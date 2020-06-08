# Job scheduler part that sends a message for Sendbird bots

## helpful code snippets

From the command line on this folder:

    node --inspect

```js
const Chatkit = require('@pusher/chatkit-server');

const env = require('./config.js');

ckInst
  .getUserRooms({ userId: "5ae041ae953aa0350cface75" })
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

res = await ckInst
  .getRoomMessages({ roomId: 6899881 });

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

### System messages

Send message as @onovabot

```js
gianpaj = "5af9faca151df625830bbfe1";
onovabot = "5bd1f7af46c62e6cdee546d0";
roomId = 15069181;

ckInst
  .apiRequest({
    method: "PUT",
    path: `/rooms/${roomId}/users/add`,
    body: {
      user_ids: [onovabot]
    },
    jwt: ckInst.generateAccessToken({ userId: gianpaj }).token
  })
  .then(() => {
    console.log("Success");
  })
  .catch(err => {
    console.log(err);
  });

ckInst
  .apiRequest({
    method: "POST",
    path: `/rooms/${roomId}/messages`,
    body: {
      text: "Hello from onova bot"
    },
    jwt: ckInst.generateAccessToken({ userId: onovabot }).token
  })
  .then(() => {
    console.log("Success");
  })
  .catch(err => {
    console.log(err);
  });
```
