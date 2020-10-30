import { FieldError } from "src/resolvers/FieldError"
import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput"
import { validateEmail } from "./validateEmail";
import { validatePassword } from "./validatePassword";
import { validateUsername } from "./validateUsername";

export const validateRegister = (options: UsernamePasswordInput): FieldError[] => {
  let errors: FieldError[] = [];

  const usernameErrors = validateUsername(options.username);
  if (usernameErrors.length > 0) {
    errors.push(...usernameErrors)
  }

  const passwordErrors = validatePassword(options.password);
  if (passwordErrors.length > 0) {
    errors.push(...passwordErrors);
  }

  const emailError = validateEmail(options.email);
  if (emailError) {
    errors.push(emailError);
  }

  return errors;
}