import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readContent } from './generate.mjs';
export function normalizeOutput(value) { return value.replace(/\r\n?/g, '\n').replace(/\n$/, ''); }
export async function executeExample(section, { timeout = 4000, python = process.env.SCROLLLAND_PYTHON || 'python3' } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'scrollland-example-'));
  try {
    for (const [name, contents] of Object.entries(section.files || {})) {
      const path = join(directory, name); await mkdir(dirname(path), { recursive: true }); await writeFile(path, contents);
    }
    const runner = "import os, sys; sys.path.insert(0, os.getcwd()); exec(compile(sys.argv[1], '<example>', 'exec'), {'__name__': '__main__'})";
    const run = spawnSync(python, ['-I', '-c', runner, section.code], { cwd: directory, input: section.stdin || '', encoding: 'utf8', timeout, maxBuffer: 1024 * 1024, env: { PATH: process.env.PATH, LANG: 'en_US.UTF-8', PYTHONIOENCODING: 'utf-8' } });
    if (run.error) throw new Error(run.error.code === 'ETIMEDOUT' ? `예제 실행이 ${timeout}ms 제한을 초과했습니다` : run.error.message);
    if (run.status !== 0) throw new Error(`종료 코드 ${run.status}: ${run.stderr.trim()}`);
    if (normalizeOutput(run.stdout) !== section.output) throw new Error(`출력 불일치\n예상: ${JSON.stringify(section.output)}\n실제: ${JSON.stringify(normalizeOutput(run.stdout))}`);
    return { stdout: normalizeOutput(run.stdout), stderr: run.stderr };
  } finally { await rm(directory, { recursive: true, force: true }); }
}
async function main() {
  const python = process.env.SCROLLLAND_PYTHON || 'python3';
  const version = spawnSync(python, ['-I', '-c', 'import sys; print(sys.version.split()[0]); raise SystemExit(sys.version_info < (3, 10))'], { encoding: 'utf8' });
  if (version.status !== 0) throw new Error('Python 3.10 이상이 필요합니다. SCROLLLAND_PYTHON으로 실행 파일을 지정할 수 있습니다.');
  const { lessons, order } = await readContent(); let total = 0;
  for (const slug of order) for (const [index, section] of lessons[slug].sections.entries()) {
    try { await executeExample(section, { python }); total++; } catch (error) { throw new Error(`${slug} 장면 ${index + 1} (${section.title}): ${error.message}`); }
  }
  console.log(`Python ${version.stdout.trim()}: ${order.length}개 레슨의 예제 ${total}개 실행·출력 일치. 각 예제는 별도 임시 폴더에서 실행하고 입력 자료를 정리했습니다.`);
}
if (process.argv[1]?.endsWith('/validate-examples.mjs')) main().catch(error => { console.error(error.message); process.exitCode = 1; });
