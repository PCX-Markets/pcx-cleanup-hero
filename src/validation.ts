import { specialChars, MAX_GIFT_MESSAGE_INPUT_LENGTH } from './constants';

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

  if (/\p{Extended_Pictographic}/u.test(message)) {
    return 'Please avoid using emojis in the message.';
  }

  return null;
};
