import { FORGOT_PASSWORD_PREFIX } from "../constants";

export const generateRedisForgotPasswordKey = (token: string) => FORGOT_PASSWORD_PREFIX + token;