# Live chat

The API exposes nestar-compatible raw WebSocket chat at `ws://localhost:<PORT_API>/` (use `wss://` behind HTTPS). This shares the API port with Socket.IO notifications at `/socket.io/`; notification clients keep their existing connection format.

Connect using the access token returned by pet-nest login/refresh:

```js
const socket = new WebSocket(`${apiWebSocketUrl}/?token=${encodeURIComponent(accessToken)}`);
```

Missing or invalid tokens join as Guest, matching nestar.

Client sends:

```json
{"event":"message","data":"Salom"}
```

Server events:

- `{"event":"info","totalClients":1,"memberData":null,"action":"Joined"}` on connection; `action` becomes `"left"` on disconnect. The count represents chat connections, including multiple tabs, not unique members.
- `{"event":"getMessages","list":[]}` sends the latest five messages to a newly connected client.
- `{"event":"message","text":"Salom","memberData":null}` broadcasts to all chat clients, including the sender.

The implementation follows nestar: `main.ts` installs `WsAdapter`, `SocketModule` provides `SocketGateway`, and `@SubscribeMessage('message')` receives the client payload. `retrievAuth`, `handleConnection`, `handleDisconnect`, `handleMessage`, `broadcastMessage`, and `emitMessage` keep the source flow. `memberData` is the member returned by pet-nest's existing `AuthService.verifyToken()`. Missing or invalid tokens become Guest. Existing Socket.IO notifications are preserved separately in `NotificationGateway` because the global adapter now uses raw WebSockets.

There is one public chat. Guests can send messages. History lives in process memory, resets on restart, and is not shared between API instances. WsAdapter ignores malformed JSON and unknown events; message payload validation follows nestar. Refreshing an access token requires reconnecting to update the chat identity.

