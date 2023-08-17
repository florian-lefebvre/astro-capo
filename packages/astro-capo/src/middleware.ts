import { defineMiddleware } from "astro/middleware";

export const withCapo = defineMiddleware(async (_context, next) => {
  const response = await next();
  const html = await response.text();
  const redactedHtml = html.replaceAll("PRIVATE INFO", "REDACTED");

  return new Response(redactedHtml, {
    status: 200,
    headers: response.headers,
  });
});
