# Onova chat server (`server.chat`)

> Part of [Onova](https://www.onova.co/), a mobile marketplace for second-hand and sustainable clothing that [Gianfranco Palumbo](https://github.com/gianpaj) and Alex Kostinskyi built in Lviv, Ukraine. The company ran until September 2019. This repository is an archive and is not maintained.

Buyers and sellers could chat once an order was paid and confirmed. This service is an [Agenda](https://github.com/agenda/agenda) worker that posts system messages into those chats as an order changes state, such as paid, confirmed or shipped. In its first version it also served a small REST API that authenticated app users with Pusher ChatKit.

Chat ran on Pusher ChatKit from 2018. Pusher shut ChatKit down in 2020, so in June 2020 the service moved to Sendbird. Photos in chat never went through the chat provider: the apps uploaded them to Google Cloud Storage through `server.data`.

| | |
|---|---|
| First commit | 2018-03-07 |
| Last commit | 2020-07-13 |
| Commits | 76 (69 by Gianfranco) |
| Code | about 250 lines of JavaScript |

### Onova repositories

- [onova-mobileapp](https://github.com/gianpaj/onova-mobileapp): the Onova and Drop iOS and Android apps
- [onova-server.data](https://github.com/gianpaj/onova-server.data): the REST API
- [onova-server.data.global](https://github.com/gianpaj/onova-server.data.global): the API fork for an international version
- [onova-server.push](https://github.com/gianpaj/onova-server.push): push notifications
- [onova-server.chat](https://github.com/gianpaj/onova-server.chat): order messages in buyer–seller chats
- [onova-webapp-drop](https://github.com/gianpaj/onova-webapp-drop): the Drop web app
- [onova-forest-admin](https://github.com/gianpaj/onova-forest-admin): the back office
- [onova-automl-server](https://github.com/gianpaj/onova-automl-server): an image classifier prototype

---

## Original README

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
