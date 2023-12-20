import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/ro";

dayjs.extend(localeData);
dayjs.locale("ro");

export function getDay(d: string) {
  return dayjs(d).date();
}

export function getMonth(d: string) {
  const m = dayjs.monthsShort();
  return m[dayjs(d).month()];
}

export function getYear(d: string) {
  return dayjs(d).year();
}

export function formatDate(d: string) {
  return dayjs(d).format("DD MMMM YYYY");
}

export function formatDateTime(d: string) {
  return dayjs(d).format("DD MMMM YYYY - HH:mm");
}

export function formatDateAs(d: string, format: string) {
  return dayjs(d).format(format);
}
