import { renderSSRHead } from "@unhead/ssr";
import { defineMiddleware } from "astro/middleware";
import { createHead, CapoPlugin } from "unhead";

// Taken from https://github.com/nuxt/nuxt/pull/22179/files#diff-db3a4ecfe5a4e5a379ed2f515a315f812ddc26b48ce80dd3f2cada3b75c06c12L433
const HTML_TAG_RE =
  /<(?<tag>[a-z]+)(?<rawAttrs> [^>]*)?>(?:(?<innerHTML>[\s\S]*?)<\/\k<tag>)?/g;
// Fixed attrs from [a-z] to [a-z-]
const HTML_TAG_ATTR_RE = /(?<name>[a-z-]+)="(?<value>[^"]*)"/g;
function extractHTMLTags(html: string) {
  const tags: {
    tagName: string;
    attrs: Record<string, string>;
    innerHTML?: string;
  }[] = [];
  for (const tagMatch of html.matchAll(HTML_TAG_RE)) {
    const attrs: Record<string, string> = {};
    for (const attrMatch of tagMatch.groups!.rawAttrs?.matchAll(
      HTML_TAG_ATTR_RE
    ) || []) {
      // @ts-expect-error
      attrs[attrMatch.groups!.name] = attrMatch.groups!.value;
    }
    const innerHTML = tagMatch.groups!.innerHTML;
    // @ts-expect-error
    tags.push({ tagName: tagMatch.groups!.tag, attrs, innerHTML });
  }
  return tags;
}

export const withCapo = defineMiddleware(async (_context, next) => {
  const response = await next();
  const html = await response.text();

  const headInnerHTML = extractHTMLTags(extractHTMLTags(html)[0]?.innerHTML!)[0]
    ?.innerHTML!;
  const tags = extractHTMLTags(headInnerHTML);

  const head = createHead({ plugins: [CapoPlugin({ track: true })] });

  for (const { tagName, attrs, innerHTML } of tags) {
    if (tagName === "title") {
      head.push({ title: innerHTML });
    } else {
      head.push({ [tagName]: [{ ...(attrs as any), innerHTML }] });
    }
  }

  const payload = await renderSSRHead(head);

  let outputHtml = html;
  const HTML_EL_TAG_RE = /<html(?<rawAttrs> [^>]*)?>/g;

  for (const tagMatch of outputHtml.matchAll(HTML_EL_TAG_RE)) {
    const attrs = tagMatch.groups?.rawAttrs || "<html";
    outputHtml = outputHtml.replace(attrs, attrs + payload.htmlAttrs);
  }

  const HEAD_EL_TAG_RE = /<head>(?:(?<innerHTML>[\s\S]*?)<\/head>)?/g;
  for (const tagMatch of outputHtml.matchAll(HEAD_EL_TAG_RE)) {
    outputHtml = outputHtml.replace(
      tagMatch.groups!.innerHTML!,
      payload.headTags
    );
  }

  return new Response(outputHtml, {
    status: 200,
    headers: response.headers,
  });
});
