import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCurriculum } from '../lib/contract.js';
import { validateMotion } from '../lib/scroll-state.js';
import { renderIndex, renderLesson } from './render-scroll.mjs';
export { renderIndex, renderLesson };
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const e = escapeHTML;
export function normalizeBasePath(value = '/') {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(value)) throw new Error('SCROLLLAND_BASE_PATH는 / 또는 /저장소이름/ 형태의 영문·숫자·밑줄·하이픈 경로여야 합니다.');
  return value;
}
export function renderNotFound(basePath = '/') {
  const href = `${normalizeBasePath(basePath)}index.html`;
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>레슨을 찾을 수 없습니다 · ScrollLand</title><style>body{margin:0;padding:48px 24px;background:#f7f8f4;color:#20312c;font:16px/1.8 sans-serif}main{max-width:640px;margin:32px auto}h1{font-size:32px;line-height:1.4}a{color:#245c4b;text-underline-offset:4px}a:focus-visible{outline:3px solid #0a6950;outline-offset:4px}</style></head><body><main><p>ScrollLand</p><h1>이 주소의 레슨을 찾을 수 없습니다.</h1><p>주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 전체 목차에서 레슨 제목을 찾아 다시 열어 주세요.</p><p><a href="${e(href)}">전체 목차 열기</a></p></main></body></html>\n`;
}
export async function readContent() {
  const curriculum = JSON.parse(await readFile(resolve(root, 'curriculum.json'), 'utf8'));
  const lessons = {};
  for (const name of (await readdir(resolve(root, 'lessons'))).filter(x => x.endsWith('.json')).sort()) lessons[name.slice(0, -5)] = JSON.parse(await readFile(resolve(root, 'lessons', name), 'utf8'));
  const order = validateCurriculum(curriculum, lessons);
  const motion = validateMotion(JSON.parse(await readFile(resolve(root, 'motion.json'), 'utf8')), lessons);
  return { curriculum, lessons, order, motion };
}
export async function generate(check = false) {
  const content = await readContent();
  const basePath = normalizeBasePath(process.env.SCROLLLAND_BASE_PATH || '/');
  const output = new Map([['index.html', renderIndex(content)], ['404.html', renderNotFound(basePath)], ...content.order.map(slug => [`learn/${slug}.html`, renderLesson(content.lessons[slug], content)])]);
  await mkdir(resolve(root, 'learn'), { recursive: true });
  const extra = (await readdir(resolve(root, 'learn'))).filter(name => name.endsWith('.html') && !output.has(`learn/${name}`));
  if (extra.length) throw new Error(`목차에 없는 생성 페이지: ${extra.join(', ')}`);
  for (const [name, html] of output) {
    if (check) { const current = await readFile(resolve(root, name), 'utf8').catch(() => ''); if (current !== html) throw new Error(`원본과 생성 결과가 다릅니다: ${name}. npm run build를 실행하세요.`); }
    else await writeFile(resolve(root, name), html);
  }
  const required = ['styles.css', 'app.js', 'favicon.svg', 'lib/contract.js', 'lib/scroll-state.js', 'lib/text-effects.js', 'lib/graph-layout.js', 'lib/gsap.min.js', 'lib/ScrollTrigger.min.js'];
  for (const file of required) await readFile(resolve(root, file));
  for (const [name, html] of output) {
    for (const [, link] of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      if (/^(?:https?:|mailto:)/.test(link)) continue;
      const decoded = link.replaceAll('&amp;', '&');
      const relative = name === '404.html' && decoded.startsWith(basePath) ? decoded.slice(basePath.length) : decoded;
      const file = resolve(root, dirname(name), relative.split(/[?#]/)[0]);
      if (!file.startsWith(`${root}/`)) throw new Error(`프로젝트 밖 링크: ${name} ${link}`);
      await readFile(file).catch(() => { throw new Error(`없는 링크: ${name} → ${link}`); });
    }
  }
  const sections = content.order.flatMap(slug => content.lessons[slug].sections);
  console.log(`${check ? '검증' : '생성'} 완료: ${content.curriculum.courses.length}개 코스, ${content.order.length}개 레슨, 읽기 ${sections.filter(section => section.kind === 'reading').length}개 구간, 시각화 ${sections.filter(section => section.kind === 'visualization').length}개 구간. 모든 내부 파일 링크 정상.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) generate(process.argv.includes('--check')).catch(error => { console.error(error.message); process.exitCode = 1; });
