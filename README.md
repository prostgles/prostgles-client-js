# prostgles-client


[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/prostgles/prostgles-client-js/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/prostgles-client.svg?style=flat)](https://www.npmjs.com/package/prostgles-client)
[![Dependency Status](https://david-dm.org/prostgles/prostgles-client-js/status.svg)](https://david-dm.org/prostgles/prostgles-client-js/status.svg#info=dependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/prostgles/prostgles-client-js/badge.svg)](https://snyk.io/test/github/prostgles/prostgles-client-js)



## Installation

Module
```bash
$ npm install prostgles-client socket.io-client
```

CDN
```html
<head>
    <script src="https://unpkg.com/socket.io-client@latest/dist/socket.io.slim.js" type="text/javascript"></script>
    <script src="https://unpkg.com/prostgles-client@latest/dist/index.js" type="text/javascript"></script>	
</head>
```

## Usage
```js
const socket = io();
prostgles({
    socket, 
    onReady: async (db) => {
        const latest_posts = await db.posts.find(
            { },
            {   
                orderBy: { created: -1 }
                limit: 15
            }
        );
    }
});
```


## License

  [MIT](LICENSE)
