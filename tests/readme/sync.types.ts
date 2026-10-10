import type { TableHandlerClient } from "prostgles-client";
import type { DBGeneratedSchema } from "./DBGeneratedSchema";

export const useSyncTypeCheck = (posts: TableHandlerClient<DBGeneratedSchema, "posts">) => {
  const syncedPosts = posts.useSync!({ published: false }, { handlesOnData: true });
  syncedPosts.data?.forEach(post => {
    void post.title;
    void post.$update({ title: "Updated title", published: true });
    // @ts-expect-error Updates must use the schema's column types.
    void post.$update({ published: "yes" });
  });
};
