'use strict';
// Small regex-based helpers for the slivers of OOXML we need. Not a general XML
// parser (pptx XML is too irregular for that to be worth it here) — deliberately
// narrow, matching this project's existing zero-dependency style (see markdown.js).

function decodeEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/** Relationship id -> target path, from a .rels file's raw XML. */
function parseRels(xml) {
  const map = new Map();
  if (!xml) return map;
  const re = /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bType="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?>/g;
  let m;
  while ((m = re.exec(xml))) map.set(m[1], { type: m[2], target: m[3] });
  return map;
}

/**
 * Order slide filenames the way PowerPoint actually orders them: via
 * presentation.xml's <p:sldIdLst> (by r:id), resolved through presentation.xml.rels.
 * Slide file numbering (slide1.xml, slide2.xml...) is NOT reliable after reordering.
 */
function orderedSlideTargets(presentationXml, presRelsXml) {
  const rels = parseRels(presRelsXml);
  const ids = [...presentationXml.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)].map((m) => m[1]);
  return ids.map((rid) => rels.get(rid)?.target).filter(Boolean).map((t) => t.replace(/^\.\.\//, ''));
}

/**
 * Extract shapes' text, in document order, from a slide (or notesSlide) XML.
 * Each shape becomes one entry: { text: string, isTitle: boolean }.
 * A shape's paragraphs are joined with \n; multiple <a:r> runs in a paragraph are concatenated.
 */
function extractShapeText(xml) {
  const shapes = [];
  const spRe = /<p:sp>([\s\S]*?)<\/p:sp>/g;
  let sm;
  while ((sm = spRe.exec(xml))) {
    const sp = sm[1];
    const isTitle = /<p:ph\b[^>]*\btype="(title|ctrTitle)"/.test(sp);
    const bodyMatch = /<p:txBody>([\s\S]*?)<\/p:txBody>/.exec(sp);
    if (!bodyMatch) continue;
    const body = bodyMatch[1];
    const paras = [...body.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map((pm) => {
      const runs = [...pm[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((rm) => decodeEntities(rm[1]));
      return runs.join('');
    }).filter((p) => p.length > 0);
    if (paras.length) shapes.push({ text: paras.join('\n'), isTitle, listItem: /<a:buChar|<a:buAutoNum/.test(sp) });
  }
  return shapes;
}

/** Every r:embed / r:link / r:id attribute value referenced anywhere in a slide's XML. */
function referencedRelIds(xml) {
  return [...new Set([...xml.matchAll(/r:(?:embed|link|id)="([^"]+)"/g)].map((m) => m[1]))];
}

module.exports = { parseRels, orderedSlideTargets, extractShapeText, referencedRelIds, decodeEntities };
