# prostgles-client

Isomorphic TypeScript client for PostgreSQL

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/prostgles/prostgles-client-js/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/prostgles-client.svg?style=flat)](https://www.npmjs.com/package/prostgles-client)
[![Known Vulnerabilities](https://snyk.io/test/github/prostgles/prostgles-client-js/badge.svg)](https://snyk.io/test/github/prostgles/prostgles-client-js)
![Tests](https://github.com/prostgles/prostgles-server-js/actions/workflows/main.yml/badge.svg)

## Features

- 🔄 Real-time data synchronization - Subscribe to database changes with WebSocket support
- 🔒 End-to-end type safety - Auto-generated TypeScript types from your database schema
- ⚛️ React hooks - First-class React support with useFind, useSubscribe and useSync
- 🌐 Isomorphic - Works in Node.js and browsers
- 🚀 Zero boilerplate - Direct database access without writing SQL
- 🔗 Relational queries - Join tables with intuitive syntax

## Installation

npm/yarn

```bash
$ npm install prostgles-client socket.io-client
```

CDN

```html
<head>
  <script
    src="https://unpkg.com/socket.io-client@3.0.3/dist/socket.io.min.js"
    type="text/javascript"
  ></script>
  <script
    src="https://unpkg.com/prostgles-client@latest/dist/index.js"
    type="text/javascript"
  ></script>
</head>
```

## Quick Start

### React hooks

Subscribe to data changes with automatic re-renders:

```tsx
import { useProstglesClient } from "prostgles-client/dist/prostgles";
import type { DBGeneratedSchema } from "@common/DBGeneratedSchema";

const App = () => {
  const client = useProstglesClient<DBGeneratedSchema>({ socketOptions: { path: "/ws-api" } });

  if(client.isLoading) return "Loading...";
  if(client.hasError) return <>Error: {client.error}</>;

  return <UserPosts dbo={client.dbo} />
}

const UserPosts = ({ dbo }: { dbo:  }) => {

  const { data: user, isLoading } = dbo.users.useSubscribeOne(
    { id: 1 },
    {
      select: {
        id: 1,
        first_name: 1,
        email: 1,
        latest_posts: {
          $leftJoin: ["posts"],
          orderBy: { created: -1 }
        }
      }
    }
  );

  if(isLoading) return "Loading ..."

  return (
    <div>
      <h1>{user.first_name}</h1>
      <p>{user.email}</p>
      <h2>Latest Posts</h2>
      <ul>
        {user.latest_posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Vanilla JavaScript

```js
prostgles({
  socket: io(),
  onReady: async (db) => {
    const latest_posts = await db.posts.find({}, { orderBy: { created: -1 } });

    // Insert data
    await dbo.posts.insert({
      title: "Hello World",
      content: "My first post",
      published: true,
    });
  },
});
```

## Type Safety

Paired with [prostgles-server](https://www.npmjs.com/package/prostgles-server), types are automatically generated from your database schema:

Learn more in the [Prostgles documentation](https://prostgles.com/api-docs).

## API Overview

### Query Methods

- find() - Fetch multiple records
- findOne() - Fetch a single record
- useFind() - React hook for find()
- useFindOne() - React hook for findOne()
- count() - Count records
- useCount() - React hook for count()
- insert() - Insert new records
- update() - Update existing records
- delete() - Delete records
- upsert() - Insert or update records

### Real-time Methods

- subscribe() - Subscribe to multiple records
- subscribeOne() - Subscribe to a single record
- sync() - Two-way sync for multiple records (local changes pushed to server)
- syncOne() - Two-way sync for a single record (local changes pushed to server)
- useSubscribe() - React hook for subscribe()
- useSubscribeOne() - React hook for subscribeOne()
- useSync() - React hook for sync()
- useSyncOne() - React hook for syncOne()

### Sync vs Subscribe

The key difference between **sync** and **subscribe** methods:

- **Subscribe** (subscribe, subscribeOne) - One-way data flow from server to client. Receives updates when data changes on the server.
- **Sync** (sync, syncOne) - Two-way data flow. Allows local optimistic updates that are automatically synced back to the server, while also receiving server updates.

```tsx
// Sync: locally modified data is propagated instantly to the client
const { data: draftPost, isLoading } = dbo.posts.useSyncOne(
  { published: false },
  { handlesOnData: true },
);
if (isLoading) return "Loading...";
if (!draftPost) {
  return <button onClick={() => dbo.posts.insert({ published: false })}>Create new post</button>;
}
return (
  <form>
    <input
      type="text"
      placeholder="Title"
      value={draftPost.title}
      onChange={(e) => draftPost.$update({ title: e.target.value })}
    />
    <input
      type="text"
      placeholder="Content"
      value={draftPost.content}
      onChange={(e) => draftPost.$update({ content: e.target.value })}
    />
    <button onClick={() => draftPost.$update({ published: true })}>Publish</button>
  </form>
);
```

## Documentation

[Full API Documentation](https://prostgles.com/api-docs)
[Examples](https://github.com/prostgles/prostgles-server-js/tree/master/examples)
[Server Setup Guide](https://www.npmjs.com/package/prostgles-server)

## License

[MIT](LICENSE)
