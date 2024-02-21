# prostgles-client
  Isomorphic TypeScript client for PostgreSQL

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/prostgles/prostgles-client-js/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/prostgles-client.svg?style=flat)](https://www.npmjs.com/package/prostgles-client)
[![Dependency Status](https://david-dm.org/prostgles/prostgles-client-js/status.svg)](https://david-dm.org/prostgles/prostgles-client-js/status.svg#info=dependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/prostgles/prostgles-client-js/badge.svg)](https://snyk.io/test/github/prostgles/prostgles-client-js)
![Tests](https://github.com/prostgles/prostgles-server-js/actions/workflows/main.yml/badge.svg)



## Installation

Module
```bash
$ npm install prostgles-client socket.io-client
```

CDN
```html
<head>
    <script src="https://unpkg.com/socket.io-client@3.0.3/dist/socket.io.min.js" type="text/javascript"></script>
    <script src="https://unpkg.com/prostgles-client@latest/dist/index.js" type="text/javascript"></script>	
</head>
```

## Usage
### Vanilla js
```js
prostgles({
  socket: io(), 
  onReady: async (db) => {
    const latest_posts = await db.posts.find({ }, { orderBy: { created: -1 } });
  }
});
```
### React hooks
```tsx
const latest_posts = dbo.posts.useFind({ }, { orderBy: { created: -1 } });
const user = dbo.users.useSubscribeOne({ id: 1 });
```
[Examples](https://github.com/prostgles/prostgles-server-js/tree/master/examples)

## License

  [MIT](LICENSE)
