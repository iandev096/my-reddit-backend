import { Migration } from '@mikro-orm/migrations';

export class Migration20201001173036 extends Migration {

  async up(): Promise<void> {
    this.addSql(';');
    this.addSql('create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "password" text not null);alter table "user" add constraint "user_username_unique" unique ("username");');
  }

}
