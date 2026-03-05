## See it in action!
[https://hudson1998x.github.io/Codefolio/](https://hudson1998x.github.io/Codefolio/)

## Git-first, by design

Codefolio treats git as the foundation, not an afterthought. Your content, your config, your components, and your history all live in a single repository. Every change is a commit. Every rollback is a `git checkout`. Collaboration is a pull request.

When you are ready to publish, you push. That is it.

---

## Designed for GitHub Pages

Codefolio is built with GitHub Pages as the primary deployment target. Your repository is your site. Push to `main`, and GitHub Pages serves your static output automatically. No build pipeline to configure, no hosting to pay for, no infrastructure to maintain.

Because your site lives in a git repository, you also get everything GitHub gives you for free: a public history of your work, contribution graphs, collaboration via pull requests, and a URL that is yours from day one.

---

## Run it offline, ship it static

The authoring server runs entirely on your local machine. Open it up, make your changes, close your laptop. No internet connection required. The admin interface, the live preview, and the config editor all work completely offline.

What lands in your repository is a clean, static website. The directories that matter are the same ones the local server already knows about:

- `build/` - the compiled JavaScript and CSS bundle
- `content/` - your page content as plain JSON
- `media/` - images and other static assets

Any host that can serve static files can serve Codefolio. Point your host at those directories and you are done. GitHub Pages, Netlify, Cloudflare Pages, an S3 bucket, a VPS with nginx. If it can serve files, it works.

---

## Fast by default

Codefolio is designed to be fast for repeat visitors without any extra configuration.

Every deployment gets a unique cache key tied to that specific version of the site. Assets and content are served with that key appended, so browsers cache them aggressively. When a visitor comes back, their browser already has everything it needs and the page loads instantly.

The interesting side effect of this is rollbacks. Because every previous version of your site had its own cache key, a visitor who already viewed that version will have it fully cached. Roll back to a previous commit and repeat visitors load the old version from their browser cache immediately, with zero round trips to the server.

New visitors always get the current version. Repeat visitors get whichever version they last saw, served from cache, until their cache is cleared or they visit again after a new deployment.

---

## Not just for portfolios

Codefolio started as a portfolio framework but the same foundation works just as well for anything that is fundamentally static content.

**Documentation sites.** Codefolio's content model maps naturally to documentation: pages, sections, code blocks, navigation trees. Author your docs locally, version them alongside your code, and ship them as a static site that loads instantly with no server.

**Static web applications.** If your app does not need a live backend, Codefolio gives you a structured, authorable way to manage its content without building a custom CMS. Landing pages, marketing sites, event pages, changelogs. Anything that is mostly content with a predictable structure is a good fit.

The same authoring experience, the same deployment model, and the same zero-infrastructure approach works across all of them.

---

## No attack surface

Because your live site is entirely static, there is nothing to attack. No server to compromise, no API to probe, no admin panel exposed to the internet. The authoring server never leaves your machine.

You are only responsible for the data you choose to make public. Everything else stays local.

---

## Plugin support

Codefolio has a built-in plugin manager accessible from the admin interface. Installing a plugin is as simple as uploading a zip file. Codefolio extracts it, registers it automatically by rebuilding the plugin loader, and it is available immediately without touching any configuration files manually.

The plugin manager gives you a clear view of everything installed: what each plugin does, where it came from, and the ability to enable, disable, or remove it at any time.

Writing a plugin is equally straightforward. A plugin is just a zip containing components, controllers, and services that follow Codefolio's existing conventions. If you can build a feature inside Codefolio, you can package it as a plugin. There is no registry to publish to, no approval process, and no compatibility matrix to worry about.

Because the authoring server is local and the output is static, plugins carry no additional security risk. A plugin cannot expose your live site to attack because there is nothing to attack. The worst a bad plugin can do is affect your local authoring experience, and the manager makes it trivial to remove.

---

## Searchable content

Codefolio builds indexes over your content automatically, making every page, project, and post searchable without a third-party search service. The index is generated at build time and shipped as part of your static output, so search works entirely client-side with no external dependencies and no API calls.

---

## AI-ready content

Because your content is plain JSON, AI tools can read and write it directly. Ask an AI to pull your CV and identify your top skills, rewrite your bio, restructure your project list, or suggest what is missing. The result is a JSON edit away from being live.

No scraping, no API integrations, no copy-pasting between tools. Your content is already in a format that AI can reason about and iterate on quickly.

---

## Your data belongs to you

There is no database. There is no cloud account. There is no subscription.

Your content lives in plain JSON files in your repository. You can read it, edit it, move it, back it up, or migrate it to something else entirely without asking anyone's permission. If Codefolio disappeared tomorrow, your content would still be there, exactly as you left it.

---

## No CSS framework lock-in

Codefolio ships with zero opinions on how your site should look. Components expose clean, predictable class names and you bring the styles. Use Tailwind, Bootstrap, plain CSS, SCSS, or nothing at all. Switch frameworks without touching a single component. The markup stays the same.

---

## Open source

Codefolio is free and open source. Read the code, fork it, contribute to it, or build your own thing on top of it. The architecture is deliberately transparent. No magic, no black boxes.

---

## Built for developers

Codefolio is not a drag-and-drop site builder for everyone. It is a framework for developers who want a great authoring experience without giving up control. If you are comfortable with git, TypeScript, and React, Codefolio will feel right at home.

---

## Getting started

```bash
git clone https://github.com/hudson1998x/codefolio
cd codefolio
npm install
npm start
```

Open `http://localhost:3000/en-admin` to start authoring. When you are happy, push to deploy.

---

## License

MIT