// SPDX-License-Identifier: GPL-3.0-or-later
import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  className?: string;
  markSize?: number;
  /** Render as a plain span instead of a link to "/" (e.g. inside a page that IS "/"). */
  as?: "link" | "span";
};

/** The Rosu mark + wordmark lockup, reused in Nav and Footer. */
export default function Brand({ className = "", markSize = 32, as = "link" }: BrandProps) {
  const content = (
    <>
      <Image
        src="/rosu-mark.svg"
        alt=""
        width={markSize}
        height={markSize}
        priority
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
    <Link href="/" className={classes} aria-label="Rosu home">
      {content}
    </Link>
  );
}
