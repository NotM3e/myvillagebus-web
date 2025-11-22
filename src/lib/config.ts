export const BASE_PATH = '/myvillagebus-web';

export function getAssetPath(path: string): string {
  // Usuń początkowy slash jeśli istnieje
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${cleanPath}`;
}