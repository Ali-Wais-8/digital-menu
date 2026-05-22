import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

export const locales = ["ar", "en", "ckb"];
export const defaultLocale = "ar";

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is a Promise in next-intl v4
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});