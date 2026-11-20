export const APP_BASE_PATH = "/projects/tenantboard";

export function appPath(path: string): string {
  return `${APP_BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
