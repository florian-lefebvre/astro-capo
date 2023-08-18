import { renderDOMHead } from "@unhead/dom";
import { defineMiddleware } from "astro/middleware";
import { JSDOM } from "jsdom";
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

  const dom = new JSDOM(html);

  const { document } = dom.window;

  const tags = extractHTMLTags(document.querySelector("head")!.innerHTML);

  // It's working because data-capo is being added to the html element
  const head = createHead({ plugins: [CapoPlugin({ track: true })] });

  for (const { tagName, attrs, innerHTML } of tags) {
    if (tagName === "title") {
      head.push({ title: innerHTML });
    } else {
      head.push({ [tagName]: [{ ...(attrs as any), innerHTML }] });
    }
  }

  await renderDOMHead(head, {
    document,
  });

  const outputHtml = dom.serialize();
  // const outputHtml = html;

  return new Response(outputHtml, {
    status: 200,
    headers: response.headers,
  });
});
