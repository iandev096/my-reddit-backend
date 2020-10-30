import { FieldError } from "../resolvers/FieldError";

export const validateUsername = (username: string, field = 'username'): FieldError[] => {
  const errors: FieldError[] = [];

  if (username.length <= 2) {
    errors.push({
      field,
      message: 'The number of characters must be more than 2'
    });
  }

  if (username.includes('@')) {
    errors.push({
      field,
      message: 'Must not contain "@"'
    });
  }
  return errors;
}