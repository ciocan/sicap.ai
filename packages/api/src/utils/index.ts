export const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const encode = (s: string) => Buffer.from(s, "utf8").toString("base64");
export const decode = (s: string) => Buffer.from(s, "base64").toString("utf8");

export const isBase64 = (str: string) => {
  if (!!str.trim() === false) {
    return false;
  }

  try {
    return encode(decode(str)) === str;
  } catch {
    return false;
  }
};
