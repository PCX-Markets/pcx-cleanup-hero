import {
  MAX_GIFT_MESSAGE_INPUT_LENGTH,
  MAX_GIFT_NAME_INPUT_LENGTH,
  MAX_EMAIL_INPUT_LENGTH,
} from './constants';

const containsEmoji = (value: string): boolean => {
  const regex = /\p{Extended_Pictographic}/u;
  return regex.test(value);
};

const validateEmail = (value: string) => {
  const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;
  return regex.test(value);
};

const containsSpecialChars = (value: string): boolean => {
  const specialChars = ['"', '&', '\\', '+', '<', '>', '=', '@'];
  return specialChars.some(char => value.includes(char));
};

export const isGiftMessageValid = (value: string): boolean => {
  return getGiftMessageValidationError(value) === null;
};

export const getGiftMessageValidationError = (value: string): string | null => {
  if (value.length > MAX_GIFT_MESSAGE_INPUT_LENGTH) {
    return `Message exceeds the maximum length of ${MAX_GIFT_MESSAGE_INPUT_LENGTH} characters.`;
  }

  if (containsSpecialChars(value)) {
    return 'Please avoid using special characters.';
  }

  if (containsEmoji(value)) {
    return 'Please avoid using emojis in the message.';
  }

  return null;
};

export const isGiftNameValid = (value: string): boolean => {
  return getGiftNameValidationError(value) === null;
};

export const getGiftNameValidationError = (value: string): string | null => {
  if (value.length < 1) {
    return 'Name is required.';
  }

  if (value.length > MAX_GIFT_NAME_INPUT_LENGTH) {
    return `Name exceeds the maximum length of ${MAX_GIFT_NAME_INPUT_LENGTH} characters.`;
  }

  if (containsSpecialChars(value)) {
    return 'Please avoid using special characters.';
  }

  if (containsEmoji(value)) {
    return 'Name field cannot contain emojis.';
  }

  return null;
};

export const isEmailValid = (value: string): boolean => {
  return getEmailValidationError(value) === null;
};

export const getEmailValidationError = (value: string): string | null => {
  if (value.length < 1) {
    return 'Email is required.';
  }

  if (value.length > MAX_EMAIL_INPUT_LENGTH) {
    return `Email address exceeds the maximum length of ${MAX_EMAIL_INPUT_LENGTH} characters.`;
  }

  if (containsEmoji(value)) {
    return 'Email field cannot contain emojis.';
  }

  if (!validateEmail(value)) {
    return 'Please enter a valid email address.';
  }

  return null;
};
