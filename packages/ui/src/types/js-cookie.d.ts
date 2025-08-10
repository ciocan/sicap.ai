declare module "js-cookie" {
  export type SameSite = "strict" | "lax" | "none";

  export interface CookieAttributes {
    path?: string;
    domain?: string;
    expires?: number | Date;
    secure?: boolean;
    sameSite?: SameSite;
  }

  export interface JsCookieStatic {
    get(name: string): string | undefined;
    get(): Record<string, string>;
    set(name: string, value: string, options?: CookieAttributes): void;
    remove(name: string, options?: { path?: string; domain?: string }): void;
  }

  const Cookies: JsCookieStatic;
  export default Cookies;
}
