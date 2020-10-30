import { ConnectionConfig } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/post";
import path from 'path';
import { User } from "./entities/User";

export default {
  entities: [Post, User],
  dbName: 'myreddit',
  user: 'postgres',
  password: 'postgres',
  type: 'postgresql',
  debug: !__prod__,
  migrations: {
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
    path: path.join(__dirname, './migrations'), // path to the folder with migrations
  }
} as ConnectionConfig /* or Parameters<typeof MikroORM.init>[0]*/;