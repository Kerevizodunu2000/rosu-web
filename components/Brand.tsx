// SPDX-License-Identifier: GPL-3.0-or-later
import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  className?: string;
  markSize?: number;
  /** Render as a plain span instead of a link to "/" (e.g. inside a page that IS "/"). */
  as?: "link" | "span";
  /** Preload the mark — only for the above-the-fold copy (the nav), not the footer. */
  priority?: boolean;
  /** Where the link goes (the home page in the current language). */
  href?: string;
  label?: string;
};

/** The Rosu mark + wordmark lockup, reused in Nav and Footer. */
export default function Brand({ className = "", markSize = 32, as = "link", priority = false, href = "/", label = "Rosu home" }: BrandProps) {
  const content = (
    <>
      <Image
        src="/rosu-mark.svg"
        alt=""
        width={markSize}
        height={markSize}
        priority={priority}
        className="shrink-0"
      />
      <span className="text-lg font-semibold tracking-tight text-fg">Rosu</span>
    </>
  );

  const classes = `inline-flex items-center gap-2.5 ${className}`;

  if (as === "span") {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} className={classes} aria-label={label}>
      {content}
    </Link>
  );
}
