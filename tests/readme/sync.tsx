import type { TableHandlerClient } from "prostgles-client";
import type { DBGeneratedSchema } from "./DBGeneratedSchema";

export const DraftPost = ({ posts }: { posts: TableHandlerClient<DBGeneratedSchema, "posts"> }) => {
  // Requires sync to be enabled for posts on the server
  const { data: draftPost, isLoading, error } = posts.useSyncOne!(
    { published: false },
    { handlesOnData: true },
  );
  if (isLoading) return "Loading...";
  if (error) return <>Error: {String(error)}</>;
  if (!draftPost) {
    return <button onClick={() => posts.insert({ published: false })}>Create new post</button>;
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
      <button type="button" onClick={() => draftPost.$update({ published: true })}>Publish</button>
    </form>
  );
};
