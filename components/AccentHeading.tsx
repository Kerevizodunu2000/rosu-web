// SPDX-License-Identifier: GPL-3.0-or-later
/** A page heading with one word (``{accent}`` in the template) in the accent gradient. */
export default function AccentHeading({ template, accent, className = "" }: {
  template: string; accent: string; className?: string;
}) {
  const [before, after = ""] = template.split("{accent}");
  return (
    <h1 className={`text-3xl font-semibold tracking-tight text-fg sm:text-4xl ${className}`}>
      {before}<span className="text-gradient-accent">{accent}</span>{after}
    </h1>
  );
}
