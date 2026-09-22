import { fingerprint, validateLesson } from './contract.js';
export async function loadVerifiedLesson(url, expected, { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, cache: 'no-cache', credentials: 'omit' });
    if (!response.ok) throw new Error(`JSON 요청 실패 (${response.status})`);
    const lesson = validateLesson(await response.json());
    if (lesson.slug !== expected.slug || lesson.sections.length !== expected.sectionCount || fingerprint(lesson) !== expected.fingerprint) throw new Error('정적 본문과 원본 JSON이 다릅니다');
    return lesson;
  } finally { clearTimeout(timer); }
}
