import {
  specialChars,
  MAX_GIFT_MESSAGE_INPUT_LENGTH,
  MAX_GIFT_NAME_INPUT_LENGTH,
  MAX_EMAIL_INPUT_LENGTH,
} from './constants';

const containsEmoji = (value: string): boolean => {
  const regex = /\p{Extended_Pictographic}/u;
  return regex.test(value);
};

const validateEmail = (email: string) => {
  const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;
  return regex.test(email);
};

export const isGiftMessageValid = (message: string): boolean => {
  return getGiftMessageValidationError(message) === null;
};

export const getGiftMessageValidationError = (message: string): string | null => {
  if (message.length > MAX_GIFT_MESSAGE_INPUT_LENGTH) {
    return `Message exceeds the maximum length of ${MAX_GIFT_MESSAGE_INPUT_LENGTH} characters.`;
  }

  if (specialChars.some(char => message.includes(char))) {
    return 'Please avoid using special characters.';
  }

  if (containsEmoji(message)) {
    return 'Please avoid using emojis in the message.';
  }

  return null;
};

export const isGiftNameValid = (name: string): boolean => {
  return getGiftNameValidationError(name) === null;
};

export const getGiftNameValidationError = (nameValue: string): string | null => {
  if (nameValue.length > MAX_GIFT_NAME_INPUT_LENGTH) {
    return `Name exceeds the maximum length of ${MAX_GIFT_NAME_INPUT_LENGTH} characters.`;
  }

  if (containsEmoji(nameValue)) {
    return 'Name field cannot contain emojis.';
  }

  return null;
};

export const isEmailValid = (email: string): boolean => {
  return getEmailValidationError(email) === null;
};

export const getEmailValidationError = (emailValue: string): string | null => {
  if (emailValue.length > MAX_EMAIL_INPUT_LENGTH) {
    return `Email address exceeds the maximum length of ${MAX_EMAIL_INPUT_LENGTH} characters.`;
  }

  if (containsEmoji(emailValue)) {
    return 'Email field cannot contain emojis.';
  }

  if (!validateEmail(emailValue)) {
    return 'Please enter a valid email address.';
  }

  return null;
};
