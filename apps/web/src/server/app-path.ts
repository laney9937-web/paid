export function assertAppPath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error('refusing non-app redirect path');
  }
  return path;
}
