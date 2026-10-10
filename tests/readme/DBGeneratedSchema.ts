export type DBGeneratedSchema = {
  users: {
    is_view: false;
    select: true;
    columns: {
      id: number;
      first_name: string;
      email: string;
    };
  };
  posts: {
    is_view: false;
    select: true;
    insert: true;
    update: true;
    delete: true;
    columns: {
      id?: number;
      user_id?: number;
      title?: string;
      content?: string;
      published?: boolean;
      created?: string;
    };
  };
};
