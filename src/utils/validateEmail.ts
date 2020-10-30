import { FieldError } from "../resolvers/FieldError";

export const validateEmail = (email: string): FieldError | null => {
  const isEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!isEmailRegex.test(email)) {
    const error: FieldError = {
      field: 'email',
      message: 'Enter a valid email'
    }
    return error;
  }
  return null;
}