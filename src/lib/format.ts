const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
export const money = (n: number) => aud.format(n);

const day = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
export const date = (d: Date | null) => (d ? day.format(d) : "—");

const stamp = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });
export const dateTime = (d: Date) => stamp.format(d);
