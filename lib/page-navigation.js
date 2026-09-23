// Only resolve explicitly published aliases. The hash can never supply a path,
// hostname, script scheme or an unknown course/lesson identifier.
export function resolveLegacyDestination(hash, routes) {
  if (typeof hash !== 'string' || !hash.startsWith('#') || !routes || typeof routes !== 'object') return null;
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
  if (!/^(?:course|lesson)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !Object.hasOwn(routes, id)) return null;
  const destination = routes[id];
  const directory = id.startsWith('course-') ? 'courses' : 'learn';
  const slug = id.slice(id.indexOf('-') + 1);
  return destination === `${directory}/${slug}.html` ? destination : null;
}
