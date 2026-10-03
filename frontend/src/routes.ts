import { useEffect, useState } from "react";

function normalizePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? "/start" : normalized;
}

function currentPath(): string {
  if (typeof window === "undefined") return "/start";
  const hash = window.location.hash.slice(1);
  if (hash) return normalizePath(decodeURIComponent(hash));
  return normalizePath(window.location.pathname);
}

function navigate(path: string, replace: boolean): void {
  const normalized = normalizePath(path);
  if (replace) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${normalized}`);
    window.dispatchEvent(new Event("popstate"));
  } else {
    window.location.hash = normalized;
  }
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(currentPath);

  useEffect(() => {
    const updatePath = () => setPathname(currentPath());
    window.addEventListener("hashchange", updatePath);
    window.addEventListener("popstate", updatePath);
    return () => {
      window.removeEventListener("hashchange", updatePath);
      window.removeEventListener("popstate", updatePath);
    };
  }, []);

  return pathname;
}

export function useRouter() {
  return {
    push: (path: string) => navigate(path, false),
    replace: (path: string) => navigate(path, true),
    back: () => window.history.back(),
  };
}