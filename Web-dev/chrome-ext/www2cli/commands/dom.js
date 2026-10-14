// Read-only inspection commands for the current page.
(() => {
  const api = window.__www2cli;
  const out = (ctx, text, kind = 'normal') => ctx.output(text, kind);
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  api.register('meta', 'Show page title, URL, description, canonical URL, language, and Open Graph metadata.', ctx => {
    const meta = name => document.querySelector(`meta[name="${name}"]`)?.content || '';
    const og = property => document.querySelector(`meta[property="${property}"]`)?.content || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
    out(ctx, [
      `Title: ${document.title || '(none)'}`, `URL: ${location.href}`, `Description: ${meta('description') || '(none)'}`,
      `Canonical: ${canonical || '(none)'}`, `Language: ${document.documentElement.lang || '(unspecified)'}`,
      `Open Graph title: ${og('og:title') || '(none)'}`, `Open Graph description: ${og('og:description') || '(none)'}`
    ].join('\n'));
  });

  api.register('links', 'List visible links with numbered indexes and hrefs.', ctx => {
    const links = api.getRoots().flatMap(root => [...root.querySelectorAll('a[href]')]);
    const unique = [...new Set(links)].filter(a => api.isVisible(a) && clean(a.innerText || a.textContent));
    api.linkIndex = unique.slice(0, 200);
    if (!api.linkIndex.length) return out(ctx, 'No visible links found.', 'muted');
    out(ctx, api.linkIndex.map((a, i) => `${i + 1}  ${clean(a.innerText || a.textContent).slice(0, 160)}\n   ${a.href.slice(0, 500)}`).join('\n\n') + (unique.length > 200 ? `\n\n… ${unique.length - 200} more links omitted.` : ''));
  });

  api.register('headings', 'List visible headings (h1–h6) in document order.', ctx => {
    const roots = api.getRoots();
    const headings = roots.flatMap(root => [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')]).filter(api.isVisible);
    out(ctx, headings.length ? headings.map(node => `${node.tagName.toLowerCase()}: ${clean(node.innerText || node.textContent)}`).join('\n') : 'No visible headings found.', headings.length ? 'normal' : 'muted');
  });

  api.register('images', 'List visible images with alt text and source URL.', ctx => {
    const images = api.getRoots().flatMap(root => [...root.querySelectorAll('img')]).filter(image => api.isVisible(image));
    out(ctx, images.length ? images.slice(0, 100).map((image, i) => `${i + 1}  alt: ${clean(image.alt) || '(no alt text)'}\n   ${(image.currentSrc || image.src).slice(0, 500)}`).join('\n\n') : 'No visible images found.', images.length ? 'normal' : 'muted');
  });

  api.register('find', 'Find visible text snippets containing the supplied phrase.', (ctx, args) => {
    const query = clean(args.join(' '));
    if (!query) return out(ctx, 'Usage: find <text>', 'error');
    const matches = [], roots = api.getRoots(), walkerByRoot = roots.map(root => document.createTreeWalker(root, NodeFilter.SHOW_TEXT));
    for (const walker of walkerByRoot) {
      let node;
      while ((node = walker.nextNode()) && matches.length < 30) {
        const parent = node.parentElement;
        if (!parent || !api.isVisible(parent) || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/i.test(parent.tagName)) continue;
        const text = clean(node.nodeValue);
        const position = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
        if (position >= 0) matches.push(`• ${text.slice(Math.max(0, position - 70), Math.min(text.length, position + query.length + 100))}`);
      }
    }
    out(ctx, matches.length ? matches.join('\n') : `No visible text matched “${query}”.`, matches.length ? 'normal' : 'muted');
  });
})();
