import type { AnchorHTMLAttributes, MouseEvent } from "react";

type HashLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

function routePath(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return href === "/" ? "/dashboard" : href;
  }
  if (href.startsWith("#/")) return href.slice(1);
  return null;
}

export default function HashLink({ href, onClick, target, ...props }: HashLinkProps) {
  const path = routePath(href);
  const anchorHref = path ? `#${path}` : href;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      !path ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== "_self")
    ) {
      return;
    }

    event.preventDefault();
    window.location.hash = path;
  };

  return <a {...props} href={anchorHref} target={target} onClick={handleClick} />;
}