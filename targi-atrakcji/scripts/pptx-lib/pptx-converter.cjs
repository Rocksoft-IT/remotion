'use strict';
// pptx -> deck.json slide converter. Deliberately does NOT try to reproduce a
// slide's original pixel layout, colours or fonts — pptx absolute positioning
// doesn't translate reliably to a clean web page across resolutions. Instead it
// extracts the slide's actual TEXT CONTENT (title + body, in reading order) into
// a simple, legible, self-contained HTML file using this app's own slide styling,
// which is genuinely editable afterward. Pictures placed on a slide are carried
// over as <img>. Embedded video/audio is never auto-wired — see MEDIA_REL_TYPES.
const path = require('path');
const { openZip } = require('./zip-reader.cjs');
const { parseRels, orderedSlideTargets, extractShapeText, referencedRelIds, decodeEntities } = require('./pptx-xml.cjs');

const MEDIA_REL_TYPES = {
  image: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
  video: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/video',
  audio: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio',
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shapesToHtml(shapes, images) {
  if (shapes.length === 0 && images.length === 0) return null;
  let title = null;
  let body = shapes;
  const explicitTitle = shapes.find((s) => s.isTitle);
  if (explicitTitle) {
    title = explicitTitle.text;
    body = shapes.filter((s) => s !== explicitTitle);
  } else if (shapes.length && !shapes[0].listItem && shapes[0].text.split('\n').length === 1 && shapes[0].text.length <= 80) {
    // No real <p:ph type="title">: heuristically treat a short single-line first shape as the title.
    title = shapes[0].text;
    body = shapes.slice(1);
  }
  const parts = [];
  if (title) parts.push(`<h1>${esc(title)}</h1>`);
  for (const shape of body) {
    const lines = shape.text.split('\n');
    if (shape.listItem) parts.push(`<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`);
    else for (const l of lines) if (l.trim()) parts.push(`<p>${esc(l)}</p>`);
  }
  for (const img of images) parts.push(`<img src="${esc(img)}" alt="" />`);
  return parts.join('\n    ');
}

// Brand mark (targi-atrakcji.pl), inline so the slide never depends on an image file.
const MARK_SVG = '<svg class="mark" viewBox="0 0 434 180" aria-hidden="true"><circle cx="218" cy="46" r="46" fill="#F3721C"/><path d="M14 166 C 70 118, 120 96, 172 130 C 208 154, 236 150, 262 132 C 300 106, 340 112, 420 166" fill="none" stroke="#fff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Wrap a slide body in a full page. Styling comes from the shared local stylesheet
 * `deck/assets/theme/slide.css` (edit once → every imported slide changes); the inline
 * block is only a fallback so the slide is still legible if that file is missing.
 * @param {string} innerHtml
 * @param {string} themeRel  relative path from the slide file to deck/assets/theme (no trailing slash)
 */
function slideHtmlPage(innerHtml, themeRel = '../../theme') {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="${esc(themeRel)}/slide.css">
<style>
  /* fallback only — real theme is ${esc(themeRel)}/slide.css */
  html,body{margin:0;height:100%;background:#092442;color:#fff;font-family:"Open Sans",system-ui,sans-serif;overflow:hidden}
  .wrap{height:100%;box-sizing:border-box;padding:7% 8%;display:flex;flex-direction:column;justify-content:center}
  h1{font-size:clamp(28px,6vw,78px);margin:0 0 .4em}
  p,li{font-size:clamp(16px,3vw,38px)}
  img{max-width:100%;max-height:48vh}
</style></head>
<body><div class="wrap">
    ${MARK_SVG}
    ${innerHtml}
</div></body></html>
`;
}

/**
 * @param {string} pptxPath
 * @returns {{
 *   slides: Array<{ title:string, notes:string, html:string, images:Array<{name:string,data:Buffer}>, hasEmbeddedMedia: boolean, mediaWarning:string|null }>,
 *   extractedMedia: Array<{ slideIndex:number, kind:string, name:string, data:Buffer }>,
 *   problems: string[],
 * }}
 */
function convertPptx(pptxPath, opts = {}) {
  const themeRel = opts.themeRel || '../../theme';
  // Deck-relative folder the extracted A/V lands in, so warnings quote a path that actually
  // works in deck.json rather than a "<presenter>" placeholder nobody can paste.
  const mediaRel = opts.mediaRel || 'assets/<presenter>/<file>/media';
  const problems = [];
  let zip;
  try { zip = openZip(pptxPath); } catch (e) { return { slides: [], extractedMedia: [], problems: [`Cannot open "${pptxPath}" as a pptx: ${e.message}`] }; }

  const read = (name) => { const b = zip.read(name); return b ? b.toString('utf8') : null; };
  const presXml = read('ppt/presentation.xml');
  const presRels = read('ppt/_rels/presentation.xml.rels');
  if (!presXml || !presRels) return { slides: [], extractedMedia: [], problems: [`"${pptxPath}" does not look like a valid .pptx (missing ppt/presentation.xml)`] };

  const order = orderedSlideTargets(presXml, presRels); // e.g. 'slides/slide3.xml', in presentation order
  if (order.length === 0) problems.push('no slides found in presentation order list');

  const slides = [];
  const extractedMedia = [];

  order.forEach((target, i) => {
    const slideDir = path.posix.dirname(target); // 'slides'
    const slideFile = path.posix.basename(target); // 'slide3.xml'
    const slideXmlPath = `ppt/${target}`;
    const relsPath = `ppt/${slideDir}/_rels/${slideFile}.rels`;
    const xml = read(slideXmlPath);
    if (!xml) { problems.push(`slide ${i + 1}: could not read ${slideXmlPath}`); return; }
    const rels = parseRels(read(relsPath));
    const usedRelIds = new Set(referencedRelIds(xml));

    const images = [];
    // One slide can carry several clips (a video *and* a backing track is common), so these
    // accumulate — an earlier version kept only the last one and silently lost the rest.
    const mediaWarnings = [];
    for (const relId of usedRelIds) {
      const rel = rels.get(relId);
      if (!rel) continue;
      const relTarget = path.posix.normalize(path.posix.join('ppt', slideDir, rel.target));
      if (rel.type === MEDIA_REL_TYPES.image) {
        const data = zip.read(relTarget);
        if (data) {
          const name = `img${i + 1}-${path.basename(relTarget)}`;
          images.push(name);
          extractedMedia.push({ slideIndex: i, kind: 'image', name, data });
        }
      } else if (rel.type === MEDIA_REL_TYPES.video || rel.type === MEDIA_REL_TYPES.audio) {
        const kind = rel.type === MEDIA_REL_TYPES.video ? 'video' : 'audio';
        const data = zip.read(relTarget);
        const name = `${kind}${i + 1}-${path.basename(relTarget)}`;
        if (data) {
          extractedMedia.push({ slideIndex: i, kind, name, data });
          // A path the operator can paste straight into the slide's "content" — deck.json
          // resolves content relative to itself, so that is the spelling that has to appear.
          // The advice differs by kind on purpose: a video has a slide type waiting for it,
          // a backing track does not — saying "make it a video slide" for an .mp3 would fail
          // deck validation and waste the operator's time on the day.
          mediaWarnings.push(kind === 'video'
            ? `Slide ${i + 1} has embedded video ("${path.basename(relTarget)}"). It was NOT wired up ` +
              `automatically — extracted to ${mediaRel}/${name}. To play it, add it as its own slide ` +
              `next to this one: \`"type": "video", "content": "${mediaRel}/${name}"\`. Check the codec ` +
              `first — mp4 (H.264/AAC) or webm is what this app plays reliably.`
            : `Slide ${i + 1} has embedded audio ("${path.basename(relTarget)}"). It was NOT wired up ` +
              `automatically — extracted to ${mediaRel}/${name}. To play it, add a backing track to ` +
              `this slide: \`"audio": "${mediaRel}/${name}"\` (it loops, and keeps playing across any ` +
              `following slides that name the same file). Set the level with \`{"content": "...", "volume": 0.4}\`.`);
        } else {
          // PowerPoint can *link* media instead of embedding it: the pptx then carries only a
          // path on the presenter's own machine, and there is nothing here to extract.
          mediaWarnings.push(
            `Slide ${i + 1} references ${kind} "${rel.target}" as a LINK, not an embedded file — ` +
            `nothing was extracted and nothing will play. Ask the presenter for the original ` +
            `${kind} file and add it as its own slide.`
          );
        }
      }
    }

    const shapes = extractShapeText(xml);
    const inner = shapesToHtml(shapes, images);
    const title = (shapes.find((s) => s.isTitle) || shapes[0] || { text: `Slide ${i + 1}` }).text.split('\n')[0];
    const notesXmlPath = [...rels.values()].find((r) => r.type.includes('notesSlide'));
    let notes = '';
    if (notesXmlPath) {
      const notesTarget = path.posix.normalize(path.posix.join('ppt', slideDir, notesXmlPath.target));
      const notesXml = read(notesTarget);
      if (notesXml) notes = extractShapeText(notesXml).map((s) => s.text).join('\n\n');
    }

    slides.push({
      title: decodeEntities(title || `Slide ${i + 1}`),
      notes,
      html: slideHtmlPage(inner || '<p><em>(empty slide)</em></p>', themeRel),
      images: images.map((name) => ({ name, data: extractedMedia.find((m) => m.name === name).data })),
      hasEmbeddedMedia: mediaWarnings.length > 0,
      mediaWarning: mediaWarnings.length ? mediaWarnings.join('\n\n') : null,
    });
    if (!inner) problems.push(`slide ${i + 1}: no text or images found — check it manually`);
  });

  return { slides, extractedMedia, problems };
}

module.exports = { convertPptx };
