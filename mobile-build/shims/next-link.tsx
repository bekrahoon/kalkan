"use client";
/** Phone-demo shim for next/link: routes live in the URL hash (#rights, #about). */
import { forwardRef } from "react";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function toHash(href: string) {
  const name = href.replace(/^\//, "").replace(/^\?/, "check?");
  return name ? `#${name}` : "#check";
}

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, onClick, ...rest }, ref) {
  return (
    <a
      ref={ref}
      href={toHash(href)}
      onClick={(e) => {
        onClick?.(e);
        window.scrollTo({ top: 0 });
      }}
      {...rest}
    />
  );
});

export default Link;
