import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData.js";
import "dayjs/locale/ro.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

const tz = "Europe/Bucharest";

dayjs.extend(localeData);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ro");

export function getDay(d: string) {
  return dayjs(d).tz(tz).date();
}

export function getMonth(d: string) {
  const m = dayjs.monthsShort();
  return m[dayjs(d).tz(tz).month()];
}

export function getYear(d: string) {
  return dayjs(d).tz(tz).year();
}

export function formatDate(d: string) {
  return dayjs(d).tz(tz).format("DD MMMM YYYY");
}

export function formatDateTime(d: string) {
  return dayjs(d).tz(tz).format("DD MMMM YYYY - HH:mm");
}

export function formatDateAs(d: string, format: string) {
  return dayjs(d).tz(tz).format(format);
}
