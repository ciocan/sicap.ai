import twilioClient from "twilio";
import ky from "ky";

import { env } from "./env";

export const twilio = twilioClient(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const sendSms = async (to: string, message: string) => {
  return ky
    .get("https://api.sendsms.ro/json", {
      searchParams: {
        username: env.SEND_SMS_USERNAME,
        password: env.SEND_SMS_API_KEY,
        action: "message_send",
        to: to.replace("+", ""),
        text: message,
      },
    })
    .json();
};

export async function sendVerificationSms(phoneNumber: string, code: string) {
  const message = `Codul tău de verificare SICAP.ai este: ${code}`;

  const isRomanianPhoneNumber = phoneNumber.startsWith("+40");

  if (isRomanianPhoneNumber) {
    return await sendSms(phoneNumber, message);
  }

  return await twilio.messages.create({
    body: message,
    from: "SICAPai",
    to: phoneNumber,
  });
}
