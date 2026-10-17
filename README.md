> **This is the review build.** It is blocked from search and its URLs
> point at this GitHub Pages address. Do not deploy this copy to the live
> site: take the production copy, which carries the real domain and a
> robots.txt that allows crawling.

# Evolving Nexus — Coming Soon landing page

Two pages, no build step, no dependencies. Upload the contents of this folder to
the web root and it runs.

```
index.html        the landing page
privacy.html      privacy notice
llms.txt          machine-readable summary for answer engines
robots.txt        declares the sitemap
sitemap.xml       two URLs plus image entries
site.webmanifest  icons and theme colour
assets/css        one stylesheet
assets/fonts      self-hosted variable subsets, so no request leaves for a font CDN
assets/img        emblems, founders photograph, social card, favicons
```

The Evolving Nexus v13 files are untouched. Everything here is new work that
takes that v13 wording as the source wherever it said things better.

---

## The review link is blocked from search, on purpose

`vercel.json` sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet,
noimageindex` on every file. That header outranks `robots.txt` for indexing, so
the preview cannot be listed by a search engine even if someone links to it.
The canonical tag already points at `https://rvaov.github.io/evolving-nexus-preview/`, which is a
second signal pointing away from the preview.

**Delete `vercel.json`, or remove that header from it, when the real site goes
live.** Leaving it in place would keep the live site out of search entirely.
`robots.txt` in this folder is written for production and is correct as it
stands.

---

## Before launch

Four things, all of which need a decision or a detail from Evolving Nexus.

**1. The mailing list endpoint.** Both forms carry
`data-endpoint="https://example.com/REPLACE-WITH-MAILERLITE-ENDPOINT"`. Until a
real endpoint is set the forms fall back to a plain POST rather than faking a
success message, so **nothing is captured**. This is the one item that stops the
page doing its job.

**2. Controller details in `privacy.html`.** Legal name, trading status and a
postal address. PECR requires a postal address on marketing material. The
line is commented out rather than shown as a placeholder, because a placeholder
shown to a visitor is worse than a line briefly missing.

**3. Social profile URLs.** Omitted rather than guessed, in the footer and in
`sameAs` on the Organization node. A wrong `sameAs` damages how search engines
resolve the entity, so empty beats wrong.

**4. A legal read of `privacy.html`.** It is a careful draft, not advice.

The domain `https://rvaov.github.io/evolving-nexus-preview` and the address `hello@evolvingnexus.com`
are **not** placeholders. Both are taken from the v13 files. If the domain
changes, update the canonical, `og:url`, `sitemap.xml` and the `@id` values in
the JSON-LD graph together.

---

## Decisions worth knowing

**The contact address is deliberately absent from the landing page.** Not the
footer, not the Organization node, not the error message, not `llms.txt`. A
`mailto:` in a footer is harvested within days. It appears only in
`privacy.html`, where the law requires a reachable contact. The form is the
route for everyone else.

**No opening date is claimed anywhere.** Add one only when the date is firm.

**No pricing and no `aggregateRating`.** Rating markup you award yourself
violates Google's guidelines. The Ken Wilber endorsement is marked up as a
`Review` on the *book*, attributed to him by name and carrying no score, which
is legitimate and feeds answer engines without claiming a rich result.

**The hero takes exactly `100svh`.** `svh` rather than `vh` or `dvh`: `vh` is
the height with mobile browser chrome hidden, so it overflows while the chrome
is still up, and `dvh` resizes the hero under the reader as the chrome hides.

**Fonts are self-hosted variable subsets.** No request leaves the origin, so no
visitor IP is disclosed to a font CDN, which is what the privacy notice
promises. Keep them local.

**Founder name order is inconsistent on purpose, and needs a decision.** The
hero sentence and the closing signature read "Nish Dubashia and Marie Murtagh",
matching the v13 files. The photograph caption and the biographies lead with
Marie. Flipping either is a one-line change.

---

## What was verified, and what was not

Verified, on every change:

| | |
|---|---|
| 13 viewports, 2 pages | no overflow, no contrast failure, no collision, no clipped text |
| Chromium, Firefox, WebKit | identical, fonts resolving in all three |
| axe-core, WCAG 2.1 A and AA | 0 violations, in three states including after sign-up |
| Keyboard | every control reachable, focus visible, order matches reading order |
| Zoom | no horizontal scrolling at 200% or 400% |
| No JavaScript | 1267 words still readable, forms still submit |
| HTML | both pages parse with no errors |
| SEO | 0 failures across two audits; every anchor, asset and sitemap entry resolves |
| Core Web Vitals | LCP ~0.8s, CLS ~0.000 |

**Not verified**, and worth doing before launch:

- A real device. These are emulated viewports in headless engines, not an actual
  iPhone with real Safari and real touch.
- A real screen reader. axe is static and runtime analysis; it is not VoiceOver,
  NVDA or JAWS.
- Real-world performance. The numbers above are localhost and say nothing about
  a visitor on mobile data.
- The copy, by Marie and Nish. Every factual claim traces to an Evolving Nexus
  source file, but nobody has checked the figures in the credentials strip.

---

## If you change the copy

The FAQ exists twice: as `<details>` elements and inside the `FAQPage` node in
the JSON-LD. Google treats schema that is not visible on the page as spam, so
**the two must stay identical**. Regenerate the schema from the markup rather
than editing it by hand.

House style, taken from the existing Evolving Nexus files: American spelling,
"program" not "programme", and no em-dashes anywhere.
