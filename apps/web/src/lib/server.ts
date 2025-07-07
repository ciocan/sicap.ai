import { checkBotId } from "botid/server";

export const checkBot = async () => {
  const verification = await checkBotId();

  if (verification.isBot) {
    throw new Error("Acces interzis");
  }
};
