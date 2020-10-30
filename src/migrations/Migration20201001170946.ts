import { Migration } from '@mikro-orm/migrations';

export class Migration20201001170946 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" rename column "user_name" to "username";');


    this.addSql('alter table "user" drop constraint "user_user_name_unique";');
  }

}
