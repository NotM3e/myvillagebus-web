const BASE_PATH = process.env.NODE_ENV === 'production' ? '/myvillagebus-web' : '';

export function getPath(path: string): string {
  return `${BASE_PATH}${path}`;
}