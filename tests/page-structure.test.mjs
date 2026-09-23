import test from 'node:test';
import assert from 'node:assert/strict';
import { readContent, renderIndex, renderCourse, renderLesson } from '../scripts/generate.mjs';
import { fingerprint } from '../lib/contract.js';
import { resolveLegacyDestination } from '../lib/page-navigation.js';

const content = await readContent();
const index = renderIndex(content);
const courses = new Map(content.curriculum.courses.map(course => [course.id, renderCourse(course, content)]));
const lessons = new Map(content.order.map(slug => [slug, renderLesson(content.lessons[slug], content)]));
const withoutScripts = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const decode = text => text.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const text = html => decode(withoutScripts(html).replace(/<[^>]*>/g, ''));
const links = html => [...withoutScripts(html).matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(match => ({ href: decode(match[1]), text: text(match[2]) }));
const address = (href, page) => new URL(href, `https://example.test/scrollland/${page}`);
const headingList = html => [...withoutScripts(html).matchAll(/<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g)].map(match => ({ level: Number(match[1]), text: text(match[2]) }));
const educationalMarkers = /data-lesson-article|data-kind="(?:reading|visualization)"|data-intro-kind="lesson"|class="reading-check"|data-scene-data/;

test('the 53 learning pages have one primary heading, unique IDs and no skipped heading levels', () => {
  const pages = new Map([['index.html', index], ...[...courses].map(([id, html]) => [`courses/${id}.html`, html]), ...[...lessons].map(([slug, html]) => [`learn/${slug}.html`, html])]);
  assert.equal(pages.size, 53);
  for (const [path, html] of pages) {
    const headings = headingList(html);
    assert.equal(headings.filter(heading => heading.level === 1).length, 1, `${path}: one h1`);
    assert.equal(headings[0].level, 1, `${path}: primary heading comes first`);
    for (let i = 1; i < headings.length; i++) assert(headings[i].level <= headings[i - 1].level + 1, `${path}: ${headings[i].text} skips a level`);
    const ids = [...withoutScripts(html).matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${path}: IDs must be unique`);
    assert(!/<(?:button|input|select|textarea)\b/.test(withoutScripts(html)), `${path}: reading and navigation need no form controls`);
  }
});

test('the home page contains only service context and correctly grouped course/lesson links', () => {
  assert(!educationalMarkers.test(index));
  assert(!index.includes('data-intro-kind="course"'));
  assert(!index.includes('data-effect='));
  const allLinks = links(index);
  const coursePaths = new Set(allLinks.map(link => address(link.href, 'index.html').pathname).filter(path => path.includes('/courses/')));
  const lessonPaths = new Set(allLinks.map(link => address(link.href, 'index.html').pathname).filter(path => path.includes('/learn/')));
  assert.deepEqual([...coursePaths].sort(), content.curriculum.courses.map(course => `/scrollland/courses/${course.id}.html`).sort());
  assert.deepEqual([...lessonPaths].sort(), content.order.map(slug => `/scrollland/learn/${slug}.html`).sort());
  for (let i = 0; i < content.curriculum.courses.length; i++) {
    const course = content.curriculum.courses[i], next = content.curriculum.courses[i + 1];
    const start = index.indexOf(`id="course-${course.id}"`);
    assert(start >= 0);
    const end = next ? index.indexOf(`id="course-${next.id}"`) : index.indexOf('</main>', start);
    const group = index.slice(start, end);
    const memberLinks = links(group).filter(link => address(link.href, 'index.html').pathname.includes('/learn/'));
    assert.deepEqual(memberLinks.map(link => address(link.href, 'index.html').pathname), course.lessons.map(slug => `/scrollland/learn/${slug}.html`));
    memberLinks.forEach((link, j) => assert(link.text.includes(content.lessons[course.lessons[j]].title)));
  }
});

test('each course contains one course introduction and exactly its authored syllabus, without lesson bodies', () => {
  for (const course of content.curriculum.courses) {
    const html = courses.get(course.id), page = `courses/${course.id}.html`;
    assert(!educationalMarkers.test(html), page);
    assert.equal((html.match(/data-intro-kind="course"/g) || []).length, 1, page);
    assert.equal(headingList(html).find(heading => heading.level === 1).text, course.intro.headline.join(''));
    const syllabus = html.match(/<ol\b[^>]*class="syllabus-list"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
    assert(syllabus, `${page}: dedicated course syllabus`);
    const syllabusLinks = links(syllabus);
    assert.deepEqual(syllabusLinks.map(link => address(link.href, page).pathname), course.lessons.map(slug => `/scrollland/learn/${slug}.html`), page);
    syllabusLinks.forEach((link, i) => assert(link.text.includes(content.lessons[course.lessons[i]].title)));
    assert(links(html).some(link => address(link.href, page).pathname === `/scrollland/learn/${course.lessons[0]}.html` && link.text.includes(content.lessons[course.lessons[0]].title)), `${page}: named first lesson link`);
    assert(links(html).some(link => address(link.href, page).pathname === '/scrollland/index.html'), `${page}: home link`);
  }
});

test('all 44 lesson pages preserve the complete ordered prose, 135 examples and answer explanations in static HTML', () => {
  let examples = 0, reading = 0, visualization = 0, effects = 0;
  for (const slug of content.order) {
    const lesson = content.lessons[slug], html = lessons.get(slug), visible = withoutScripts(html);
    assert.equal((visible.match(/data-lesson-article/g) || []).length, 1, slug);
    assert.equal((visible.match(/data-intro-kind="lesson"/g) || []).length, 1, slug);
    assert(!visible.includes('data-intro-kind="course"'), slug);
    assert(html.includes(`data-content-fingerprint="${fingerprint(lesson)}"`), slug);
    assert.equal(headingList(html).find(heading => heading.level === 1).text, lesson.title);
    const rendered = [...visible.matchAll(/<section\b[^>]*id="([^"]+)"[^>]*data-kind="(reading|visualization)"[^>]*>([\s\S]*?)<\/section>/g)];
    assert.deepEqual(rendered.map(match => match[1]), lesson.sections.map(section => section.id), slug);
    for (let i = 0; i < lesson.sections.length; i++) {
      const section = lesson.sections[i], markup = rendered[i][3], sectionText = text(markup);
      section.kind === 'reading' ? reading++ : visualization++;
      assert.equal(rendered[i][2], section.kind, section.id);
      const prose = markup.match(/<div class="section-prose">([\s\S]*?)<\/div>/)?.[1];
      assert(prose, section.id);
      const paragraphs = [...prose.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => text(match[1]));
      assert.deepEqual(paragraphs, section.body.map(paragraph => typeof paragraph === 'string' ? paragraph : paragraph.map(run => run.text).join('')), section.id);
      effects += (markup.match(/data-effect=/g) || []).length;
      if (section.code !== undefined) {
        examples++;
        const staticCode = markup.match(/<div class="example-code">[\s\S]*?<code>([\s\S]*?)<\/code>/)?.[1];
        assert(staticCode, `${section.id}: full static code`);
        const expected = section.code.split('\n');
        const actual = [...staticCode.matchAll(/<span class="line-source">([\s\S]*?)<\/span>/g)].map((match, line) => expected[line] === '' && text(match[1]) === ' ' ? '' : text(match[1]));
        assert.deepEqual(actual, expected, section.id);
        const output = markup.match(/<div class="example-output">[\s\S]*?<pre>([\s\S]*?)<\/pre>/)?.[1];
        assert.equal(text(output ?? ''), section.output || '(표준 출력 없음)', `${section.id}: output`);
      }
      if ('stdin' in section) assert(sectionText.includes(section.stdin || '(빈 입력)'), `${section.id}: stdin`);
      for (const [name, value] of Object.entries(section.files || {})) {
        assert(sectionText.includes(name), `${section.id}: input filename`);
        assert(sectionText.includes(value || '(빈 파일)'), `${section.id}: input file text`);
      }
      for (const step of section.trace || []) {
        assert(sectionText.includes(step.label), `${section.id}: state label`);
        assert(sectionText.includes(step.state), `${section.id}: state text`);
      }
      for (const paragraph of section.interpretation || []) assert(sectionText.includes(typeof paragraph === 'string' ? paragraph : paragraph.map(run => run.text).join('')), `${section.id}: interpretation`);
    }
    const lessonText = text(visible);
    for (const value of [lesson.intro.hook, lesson.intro.connection, lesson.intro.payoff, lesson.goal, lesson.quiz.question, lesson.takeaway, ...lesson.quiz.options.flatMap(option => [option.text, option.feedback])]) assert(lessonText.includes(value), `${slug}: ${value}`);
    lesson.sourceUrls.forEach(url => assert(links(html).some(link => link.href === url), `${slug}: official source`));
  }
  const sourceSections = content.order.flatMap(slug => content.lessons[slug].sections);
  assert.deepEqual({ examples, reading, visualization, effects }, {
    examples: 135,
    reading: sourceSections.filter(section => section.kind === 'reading').length,
    visualization: sourceSections.filter(section => section.kind === 'visualization').length,
    effects: 6,
  });
});

test('all lesson prerequisite and sequential links reach direct pages and crossing-course links name both destinations', () => {
  for (let i = 0; i < content.order.length; i++) {
    const slug = content.order[i], lesson = content.lessons[slug], html = lessons.get(slug), page = `learn/${slug}.html`;
    const allLinks = links(html);
    assert(!allLinks.some(link => /index\.html#(?:course|lesson)-/.test(link.href)), `${slug}: no new legacy links`);
    assert(allLinks.some(link => address(link.href, page).pathname === `/scrollland/courses/${lesson.courseId}.html`), `${slug}: own course`);
    const prerequisites = html.match(/<p class="prerequisites">([\s\S]*?)<\/p>/)?.[1] || '';
    assert.deepEqual(links(prerequisites).map(link => address(link.href, page).pathname), lesson.prerequisites.map(prereq => `/scrollland/learn/${prereq}.html`), `${slug}: prerequisite order`);
    for (const prereq of lesson.prerequisites) assert(links(prerequisites).some(link => link.text.includes(content.lessons[prereq].title)), `${slug}: prerequisite name`);
    const nav = html.match(/<nav\b[^>]*aria-label="레슨 이동"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert(nav, `${slug}: sequential navigation`);
    const destinations = links(nav).filter(link => /\/learn\//.test(address(link.href, page).pathname));
    const targets = [content.order[i - 1], content.order[i + 1]].filter(Boolean);
    assert.deepEqual(destinations.map(link => address(link.href, page).pathname), targets.map(target => `/scrollland/learn/${target}.html`), `${slug}: previous/next`);
    destinations.forEach((link, j) => {
      const target = content.lessons[targets[j]];
      assert(link.text.includes(target.title), `${slug}: destination lesson name`);
      if (target.courseId !== lesson.courseId) assert(link.text.includes(content.curriculum.courses.find(course => course.id === target.courseId).title), `${slug}: destination course name`);
    });
  }
});

test('52 legacy home hashes have explicit local targets and usable static catalog anchors', () => {
  const encoded = index.match(/<script\b[^>]*type="application\/json"[^>]*data-legacy-routes[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert(encoded, 'home exposes the allowed legacy route map');
  const routes = JSON.parse(encoded);
  const expected = Object.fromEntries(content.curriculum.courses.flatMap(course => [[`course-${course.id}`, `courses/${course.id}.html`], ...course.lessons.map(slug => [`lesson-${slug}`, `learn/${slug}.html`])]));
  assert.deepEqual(routes, expected);
  assert.equal(Object.keys(routes).length, 52);
  for (const [id, target] of Object.entries(routes)) {
    assert(index.includes(`id="${id}"`), `${id}: usable without JavaScript`);
    assert(links(index).some(link => link.href === target), `${id}: static destination link`);
    assert(!target.includes('..') && !/[:?#]/.test(target), `${id}: local page only`);
    assert.equal(resolveLegacyDestination(`#${id}`, routes), target);
    assert.equal(resolveLegacyDestination(`#${encodeURIComponent(id)}`, routes), target);
  }
  assert(!Object.hasOwn(routes, 'courses'));
  for (const hash of ['#courses', '#unknown', '#lesson-missing', '#course-missing', '#%E0%A4%A', '#lesson-../x', '#https://example.test', 'lesson-functions']) assert.equal(resolveLegacyDestination(hash, routes), null, hash);
  for (const target of ['https://example.test', '//example.test', '../learn/functions.html', 'javascript:alert(1)', 'learn/other.html']) assert.equal(resolveLegacyDestination('#lesson-functions', {'lesson-functions': target}), null);
  for (const html of [...courses.values(), ...lessons.values()]) assert(!html.includes('data-legacy-routes'), 'legacy redirects only belong to the home page');
});

let legacyRun = 0;
function legacyBrowser(t, hash, { prohibitSetup = false } = {}) {
  const routeNode = { textContent: index.match(/<script\b[^>]*data-legacy-routes[^>]*>([\s\S]*?)<\/script>/)[1] };
  const listeners = new Map(), replacements = [];
  const prior = Object.fromEntries(['window', 'document'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const name of ['window', 'document']) prior[name] ? Object.defineProperty(globalThis, name, prior[name]) : delete globalThis[name];
  });
  const location = { hash, href: `https://example.test/scrollland/index.html${hash}`, replace: value => replacements.push(value) };
  let setupCalls = 0;
  globalThis.window = {
    location, history: { state: null }, performance: { getEntriesByType: () => [{ type: 'navigate' }] }, innerHeight: 800,
    matchMedia: () => { setupCalls++; if (prohibitSetup) throw new Error('legacy redirection must precede animation setup'); return { matches: true, addEventListener() {}, removeEventListener() {} }; },
    addEventListener: (name, callback) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
    requestAnimationFrame: callback => callback(),
  };
  globalThis.document = {
    body: { dataset: { pageKind: 'home' } }, readyState: 'complete',
    documentElement: { classList: { remove() {} } },
    querySelector: selector => selector === '[data-legacy-routes]' ? routeNode : null,
    querySelectorAll: () => [], getElementById: () => null,
  };
  return { replacements, routeNode, setupCalls: () => setupCalls, hashchange: hash => { location.hash = hash; for (const callback of listeners.get('hashchange') || []) callback({ type: 'hashchange' }); } };
}

test('a known legacy entry replaces the home URL before learning motion or position setup begins', async t => {
  const browser = legacyBrowser(t, '#lesson-functions', { prohibitSetup: true });
  await import(`../app.js?page-boundary=${++legacyRun}`);
  assert.deepEqual(browser.replacements, ['learn/functions.html']);
  assert.equal(browser.setupCalls(), 0);
});

test('an already-open catalog resolves known hash changes and leaves unknown or malformed routes readable', async t => {
  const browser = legacyBrowser(t, '#courses');
  const app = await import(`../app.js?page-boundary=${++legacyRun}`);
  assert.equal(browser.setupCalls(), 1);
  assert.deepEqual(browser.replacements, []);
  browser.hashchange('#course-objects');
  assert.deepEqual(browser.replacements, ['courses/objects.html']);
  browser.hashchange('#lesson-unknown');
  browser.hashchange('#courses');
  browser.routeNode.textContent = '{invalid-json';
  browser.hashchange('#lesson-functions');
  assert.deepEqual(browser.replacements, ['courses/objects.html']);
  assert.equal(app.redirectLegacyEntry(), false);
  document.body.dataset.pageKind = 'lesson';
  browser.routeNode.textContent = '{"lesson-functions":"learn/functions.html"}';
  assert.equal(app.redirectLegacyEntry(), false, 'a lesson hash must never invoke home migration');
  assert.equal(browser.setupCalls(), 1, 'hash changes do not rebuild the catalog');
});
