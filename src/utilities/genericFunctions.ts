export const randomNumber = (start = 100000, end = 999999) => {
  return Math.floor(Math.random() * end) + start;
};

export const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);
