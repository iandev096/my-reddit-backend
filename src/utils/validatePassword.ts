import { FieldError } from "../resolvers/FieldError";

export const validatePassword = (password: string, field = 'password'): FieldError[] => {
  const errors: FieldError[] = [];

  if (password.length <= 4) {
    errors.push({
      field,
      message: 'Password must be more than 4 characters'
    });
  }
  return errors;
}