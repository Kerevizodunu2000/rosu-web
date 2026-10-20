// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import Markdown from "@/components/Markdown";
import { getPost, listPosts } from "@/lib/devlog";
import { localePath, type Locale } from "@/lib/i18n";
import { dict } from "@/content/i18n";

export function DevlogIndexView({ locale }: { locale: Locale }) {
  const t = dict(locale).devlog;
  const posts = listPosts();
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        <span className="text-gradient-accent">{t.title}</span>
      </h1>
      <p className="mt-3 text-fg-muted">{t.intro}{locale !== "en" && <> {t.postsInEnglish}</>}</p>
      <ul className="mt-10 flex flex-col gap-5">
        {posts.map((p) => (
          <li key={p.slug} className="card p-6 sm:p-7" lang="en">
            <time dateTime={p.date} className="font-mono text-xs uppercase tracking-wide text-fg-muted">{p.date}</time>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-fg">
              <Link href={localePath(locale, `/devlog/${p.slug}`)} className="hover:underline underline-offset-4">{p.title}</Link>
            </h2>
            <p className="mt-2 leading-relaxed text-fg-muted">{p.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DevlogPostView({ locale, slug }: { locale: Locale; slug: string }) {
  const t = dict(locale).devlog;
  const post = getPost(slug);
  if (!post) return null;
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <Link href={localePath(locale, "/devlog")} className="text-sm text-accent-2 hover:underline underline-offset-4">{t.back}</Link>
      {locale !== "en" && <p className="mt-4 text-sm text-fg-muted">{t.postsInEnglish}</p>}
      <div lang="en">
        <time dateTime={post.date} className="mt-6 block font-mono text-xs uppercase tracking-wide text-fg-muted">{post.date}</time>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{post.title}</h1>
        <Markdown source={post.body} locale={locale} className="mt-4" />
      </div>
    </article>
  );
}
