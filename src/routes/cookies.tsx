import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Cookie Policy — Fresh Teacher's Platform" },
      {
        name: "description",
        content:
          "How Fresh Teacher's Platform uses cookies to keep the resource library working and remember your preferences.",
      },
      { property: "og:title", content: "Cookie Policy — Fresh Teacher's Platform" },
      {
        property: "og:description",
        content:
          "How Fresh Teacher's Platform uses cookies to keep the resource library working and remember your preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Cookie Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fresh Teacher&apos;s Platform — last updated November 2026
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-xl font-semibold">What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help the
          site remember your choices and keep features working as expected.
        </p>

        <h2 className="text-xl font-semibold">How Fresh Teacher&apos;s Platform uses cookies</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Essential cookies</strong> — required for the library to load pages, remember
            your cookie choice, and keep the Fresh App install prompt preferences you set.
          </li>
          <li>
            <strong>Preference storage</strong> — we remember choices such as dismissing the install
            prompt so we do not keep asking you.
          </li>
        </ul>

        <h2 className="text-xl font-semibold">Managing cookies</h2>
        <p>
          You can clear or block cookies at any time through your browser settings. Blocking
          essential cookies may stop some parts of the library — such as remembering your consent —
          from working properly.
        </p>

        <h2 className="text-xl font-semibold">Changes to this policy</h2>
        <p>
          We may update this cookie policy from time to time. Any changes will be posted on this
          page with an updated date.
        </p>

        <p className="pt-4">
          <Link to="/" className="font-medium text-primary underline underline-offset-2">
            Back to the library
          </Link>
        </p>
      </section>
    </main>
  );
}
