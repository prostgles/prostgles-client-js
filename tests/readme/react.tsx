import { defineJoin, useProstglesClient, type TableHandlerClient } from "prostgles-client";
import type { DBGeneratedSchema } from "./DBGeneratedSchema";

export const App = () => {
  const client = useProstglesClient<DBGeneratedSchema>({ socketOptions: { path: "/ws-api" } });

  if (client.isLoading) return "Loading...";
  if (client.hasError) return <>Error: {String(client.error)}</>;
  if (!client.db.users) return "Users unavailable";

  return <UserPosts users={client.db.users} />;
};

export const UserPosts = ({ users }: { users: TableHandlerClient<DBGeneratedSchema, "users"> }) => {
  const { data: user, isLoading, error } = users.useSubscribeOne(
    { id: 1 },
    {
      select: {
        id: 1,
        first_name: 1,
        email: 1,
        latest_posts: defineJoin({
          $leftJoin: ["posts"],
          select: "*",
          orderBy: { created: -1 }
        })
      }
    }
  );

  if (isLoading) return "Loading...";
  if (error) return <>Error: {String(error)}</>;
  if (!user) return "User not found";

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
};
