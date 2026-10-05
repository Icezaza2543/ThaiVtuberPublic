import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publicPages=['index.html','directory.html','about.html','terms.html','terms-of-use.html','privacy.html','data-license.html'];
const legalLinks=['/terms','/terms-of-use','/privacy','/data-license'];
const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('every public page has unique SEO metadata canonical and legal footer links',()=>{
  const titles=new Set();
  for(const file of publicPages){
    const html=text(file),title=html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title,`${file} missing title`);assert.equal(titles.has(title),false,`${file} duplicate title`);titles.add(title);
    assert.match(html,/<meta name="description" content="[^"]+">/);
    assert.match(html,/<link rel="canonical" href="https:\/\/vthaidex\.vercel\.app[^"]*">/);
    assert.match(html,/<meta property="og:title" content="[^"]+">/);
    assert.match(html,/<meta property="og:description" content="[^"]+">/);
    for(const href of legalLinks) assert.ok(html.includes(`href="${href}"`),`${file} missing ${href}`);
  }
});
test('contribution page is noindex and contains no analytics scripts',()=>{
  const html=text('contribute.html');assert.match(html,/<meta name="robots" content="noindex, nofollow">/);
  assert.equal(/gtag|googletagmanager|plausible|posthog/i.test(html),false);
});
test('navigation uses real routes instead of hash routes',()=>{
  for(const file of [...publicPages,'contribute.html']) assert.equal(/href="#(?:overview|directory|about|contribute)"/.test(text(file)),false);
});
test('robots and sitemap expose only intended public surfaces',()=>{
  const robots=text('robots.txt');assert.match(robots,/Disallow: \/api\//);assert.match(robots,/Disallow: \/contribute/);assert.match(robots,/Disallow: \/internal\//);
  const sitemap=text('sitemap.xml');for(const path of ['/','/directory','/about','/terms','/terms-of-use','/privacy','/data-license']) assert.ok(sitemap.includes(`https://vthaidex.vercel.app${path}`));
  assert.equal(sitemap.includes('https://vthaidex.vercel.app/contribute'),false);
});
test('repository license separates CC BY site content from compiled data rights',()=>{
  const license=text('LICENSE.md');assert.match(license,/CC BY 4\.0/i);assert.match(license,/Database.*All Rights Reserved/is);assert.match(license,/third-party/i);
});
