import { User } from "../entities/User";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { MyContext } from "../types";
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { UserResponse } from "./UserResponse";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from 'uuid';
import { validatePassword } from "../utils/validatePassword";
import { generateRedisForgotPasswordKey } from "../utils/generateRedisKey";

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(
    @Ctx() { req, em }: MyContext
  ) {
    if (!req.session!.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session!.userId });
    return user;
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const user = await em.findOne(User, { email });
    if (!user) {
      // email not in db
      return true;
    }

    const token = v4();
    const key = generateRedisForgotPasswordKey(token);
    await redis.set(
      key,
      user.id,
      'ex',
      // 3 days
      1000 * 60 * 60 * 24 * 3
    );

    const html = `
      <a href="http://localhost:3000/change-passoword/${token}">Reset Password</a>
    `;
    sendEmail(email, html);
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, em, req }: MyContext
  ): Promise<UserResponse> {
    const passwordErrors = validatePassword(newPassword, 'newPassword');

    if (passwordErrors.length > 0) {
      return { errors: passwordErrors }
    }

    const key = generateRedisForgotPasswordKey(token);
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [{
          field: 'token',
          message: 'token expired'
        }]
      }
    }

    const user = await em.findOne(User, { id: parseInt(userId) });

    if (!user) {
      return {
        errors: [{
          field: 'token',
          message: 'user no longer exists'
        }]
      }
    }

    user.password = await argon2.hash(newPassword);

    await em.persistAndFlush(user);

    // logging in user after changing password
    req.session!.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors.length > 0) {
      return { errors };
    }

    let user;
    const hashedPassword = await argon2.hash(options.password);
    try {
      const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery()
        .insert({
          username: options.username,
          password: hashedPassword,
          email: options.email,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      user = result[0];
    } catch (err) {
      // duplicate username error
      if (err.code === '23505' || err?.detail?.includes('already exists')) {
        return {
          errors: [{
            field: 'username',
            message: 'username already exists'
          }]
        }
      }
      console.log('err: ', err.message)
    }

    // console.log(user)
    // stores userId in session
    // this will set a cookie on the user
    // keep them logged in
    req.session!.userId = user.id;

    return {
      user: {
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        id: user.id,
        password: user.password,
        username: user.username
      } as User
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });
    if (!user) {
      return {
        errors: [{
          field: 'usernameOrEmail',
          message: 'That username/email does not exist'
        }]
      }
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [{
          field: 'password',
          message: 'Invalid Login'
        }]
      }
    };

    req.session!.userId = user.id;

    return {
      user
    };
  }

  @Mutation(() => Boolean)
  logout(
    @Ctx() { req, res }: MyContext
  ) {
    // req.session.destroy destroys the seesion in redis
    return new Promise(resolve => req.session!.destroy(err => {
      if (err) {
        console.log(err);
        resolve(false);
        return;
      }

      // clearing the cookie set. I believe the key is 'qid'
      res.clearCookie(COOKIE_NAME);
      resolve(true);
    }))

  }
}