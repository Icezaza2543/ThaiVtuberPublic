"""Validate the hand-written VThaiDex logo study; Python standard library only."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent
NS = '{http://www.w3.org/2000/svg}'
FOLDERS = ['01-open-stage', '02-pocket-dex', '03-lotus-loop',
           '04-hello-avatar', '05-voice-v', '06-shared-sky']
ALLOWED = {'svg', 'title', 'desc', 'g', 'path', 'circle', 'rect'}

def check_svg(source, name, variant, limit=False):
    assert '<!DOCTYPE' not in source.upper(), f'{name}: DTD forbidden'
    assert '<?' not in source, f'{name}: processing instruction forbidden'
    root = ET.fromstring(source)
    assert root.tag == NS + 'svg', f'{name}: SVG namespace missing'
    expected = '0 0 280 64' if variant == 'lockup' else '0 0 64 64'
    assert root.get('viewBox') == expected, f'{name}: wrong viewBox'
    ids = {el.get('id'): el for el in root.iter() if el.get('id')}
    refs = root.get('aria-labelledby', '').split()
    assert len(refs) == 2 and all(ref in ids for ref in refs), f'{name}: accessible labels missing'
    for tag in ['title', 'desc']:
        el = root.find(NS + tag)
        assert el is not None and re.search('[\u0e00-\u0e7f]', el.text or ''), f'{name}: Thai {tag} missing'
    colours = set()
    geometry = 0
    for el in root.iter():
        tag = el.tag.removeprefix(NS)
        assert tag in ALLOWED, f'{name}: forbidden element {tag}'
        if tag in {'path', 'circle', 'rect'}:
            geometry += 1
        if tag == 'path':
            assert el.get('d'), f'{name}: empty path'
        if tag == 'circle':
            assert float(el.get('r', '0')) >= 2, f'{name}: tiny circle'
        if tag == 'rect':
            assert float(el.get('width', '0')) >= 2 and float(el.get('height', '0')) >= 2, f'{name}: tiny rectangle'
        for key, value in el.attrib.items():
            assert not key.lower().startswith('on'), f'{name}: event handler'
            assert key not in {'style', 'href', '{http://www.w3.org/1999/xlink}href'}, f'{name}: style or reference'
            assert not any(s in value.lower() for s in ['url(', 'data:', 'base64', 'javascript:', 'http:']), f'{name}: external reference'
            if key == 'stroke-width':
                assert float(value) >= 2, f'{name}: hairline stroke'
            if key in {'fill', 'stroke'}:
                assert value in {'none', 'currentColor'} or re.fullmatch('#[0-9a-fA-F]{6}', value), f'{name}: unexpected paint'
                if value not in {'none', 'currentColor'}:
                    colours.add(value.upper())
                if variant == 'mono':
                    assert value in {'none', 'currentColor'}, f'{name}: mono uses fixed colour'
    assert geometry, f'{name}: no drawing'
    assert len(colours) <= 4, f'{name}: too many colours'
    if variant == 'lockup':
        wordmark = root.findall(NS + 'g')[-1]
        assert len(wordmark.findall(NS + 'path')) == 9, f'{name}: eight letter paths plus the i-dot path required'
        assert all(el.tag == NS + 'path' for el in wordmark), f'{name}: wordmark must contain paths only'
    if limit:
        assert len(source.encode('utf-8')) <= 3000, f'{name}: mark exceeds conservative 3 KB limit'
    return root

class PreviewCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.images = []
        self.inline = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        assert tag not in {'script', 'iframe', 'object', 'embed', 'link'}, f'preview: forbidden {tag}'
        if 'id' in a:
            assert a['id'] not in self.ids, f'preview: duplicate id {a["id"]}'
            self.ids.add(a['id'])
        if tag == 'img':
            self.images.append(a)
        if tag == 'svg':
            self.inline.append(a)
        if tag == 'a':
            self.links.append(a['href'])

def main():
    expected = {ROOT / f / n for f in FOLDERS for n in ['mark.svg', 'mark-mono.svg', 'lockup.svg']}
    assert set(ROOT.rglob('*.svg')) == expected, 'Expected exactly 18 SVG files in six concept folders'
    readme = (ROOT / 'README.md').read_text(encoding='utf-8')
    for folder in FOLDERS:
        sizes = []
        for filename, variant in [('mark.svg', 'mark'), ('mark-mono.svg', 'mono'), ('lockup.svg', 'lockup')]:
            p = ROOT / folder / filename
            source = p.read_text(encoding='utf-8')
            check_svg(source, f'{folder}/{filename}', variant, limit=variant == 'mark')
            sizes.append(p.stat().st_size)
        row = f'| `{folder}` | {sizes[0]} | {sizes[1]} | {sizes[2]} |'
        assert row in readme, f'{folder}: README byte sizes out of date'
        print(f'{folder}: mark {sizes[0]} B; mono {sizes[1]} B; lockup {sizes[2]} B — XML OK')
    page = (ROOT / 'index.html').read_text(encoding='utf-8')
    preview = PreviewCheck()
    preview.feed(page)
    for href in preview.links:
        if href.startswith('#'):
            assert href[1:] in preview.ids, f'Broken anchor: {href}'
        else:
            assert not re.match(r'[a-z]+:', href), f'External URL: {href}'
            assert (ROOT / href).is_file(), f'Missing file: {href}'
    for folder in FOLDERS:
        for size in [16, 32, 64, 128, 256]:
            matching = [a for a in preview.images if a['src'] == folder + '/mark.svg' and a.get('width') == str(size) and a.get('height') == str(size)]
            assert len(matching) == 2, f'{folder}: expected {size} px on both backgrounds'
            matching_mono = [a for a in preview.inline if a.get('aria-labelledby', '').startswith(folder + '-') and '-mono-' + str(size) + '-t' in a['aria-labelledby']]
            assert len(matching_mono) == 2, f'{folder}: mono {size} px missing'
    for index, fragment in enumerate(re.findall(r'<svg\b.*?</svg>', page, re.S)):
        variant = 'lockup' if 'viewBox="0 0 280 64"' in fragment else 'mono'
        check_svg(fragment, f'preview inline {index}', variant)
    assert len(preview.inline) == 72, 'Expected 60 mono samples and 12 lockups'
    for a in preview.images:
        assert a['src'].endswith('.svg') and (ROOT / a['src']).is_file(), 'Preview must use local SVG only'
    assert '#ffffff' in page and '#120f1f' in page, 'Required backgrounds missing'
    print('PASS: 18 SVGs, 72 inline SVGs, both five-size ladders, local links, Thai metadata, colour limits, currentColor mono, path wordmarks, README byte sizes.')

if __name__ == '__main__':
    main()
