"""One-off migration of pintermarta.uni-eszterhazy.hu into this project.

Reads the saved pages in _scrape/html, downloads every image and uploaded file,
and writes Markdown to src/content/oldalak, images to src/assets, files to
public/letoltesek.  Run from the project root:  python3 -I tools/migrate.py
"""
import hashlib, os, re, shutil, subprocess, sys
from html.parser import HTMLParser
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPE = os.path.join(ROOT, '_scrape')
CACHE = os.path.join(SCRAPE, 'cache')
OLD = 'pintermarta.uni-eszterhazy.hu'

# old file -> (new slug, title)
PAGES = {
    'index': ('hirek', 'Hírek, aktualitások'),
    'esemenyek': ('esemenyek', 'Események'),
    'nevjegy': ('nevjegy', 'Tudományos önéletrajz'),
    'dijak': ('dijak', 'Ösztöndíjak, kitüntetések'),
    'konyvek': ('konyvek', 'Könyvek'),
    'online-konyvek': ('online-konyvek', 'Online hozzáférhető könyvek'),
    'tanulmanyok': ('tanulmanyok', 'Tanulmányok'),
    'kritikak-recenziok': ('kritikak', 'Kritikák, recenziók'),
    'konferenciak': ('konferenciak', 'Konferenciák'),
    'radios-eloadasok': ('radio', 'Rádiós előadások'),
    'videofelvetelek': ('video', 'Videófelvételek'),
    'galeria-20': ('galeria', 'Galéria'),
}
OLD_PATHS = {
    '/hu/szemelyes/esemenyek': '/esemenyek/', '/hu/szemelyes': '/esemenyek/',
    '/hu/szemelyes/dijak': '/dijak/', '/hu/szemelyes/nevjegy': '/nevjegy/',
    '/hu/tudomany/konferenciak': '/konferenciak/', '/hu/tudomany': '/konferenciak/',
    '/hu/tudomany/kritikak-recenziok': '/kritikak/', '/hu/tudomany/tanulmanyok': '/tanulmanyok/',
    '/hu/tudomany/konyvek': '/konyvek/', '/hu/tudomany/radios-eloadasok': '/radio/',
    '/hu/tudomany/videofelvetelek': '/video/', '/hu/galeria-20': '/galeria/',
    '/hu/online-konyvek': '/online-konyvek/',
}
SO, SC, EO, EC = '\x01', '\x02', '\x03', '\x04'   # strong/em open/close markers
warnings = []


def fetch(url):
    """Download url into the cache (once); return the cached path or None."""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest())
    if os.path.exists(path + '.miss'):
        return None
    if not os.path.exists(path):
        r = subprocess.run(['curl', '-sfL', '-m', '300', '--retry', '2', '-o', path + '.part', url])
        if r.returncode != 0 or not os.path.getsize(path + '.part'):
            open(path + '.miss', 'w').close()
            warnings.append('download failed: ' + url)
            return None
        os.rename(path + '.part', path)
    return path


def norm(url):
    url = url.strip()
    url = re.sub(r'^https?://' + re.escape(OLD) + r'/+', 'https://' + OLD + '/', url)
    return url


class Assets:
    def __init__(self):
        self.images = {}      # url -> path relative to src/assets
        self.files = {}       # url -> public name
        self.file_hash = {}   # public name -> content hash
        self.counters = {}

    def image(self, url, slug):
        url = norm(url)
        if url in self.images:
            return self.images[url]
        src = fetch(url)
        if not src:
            return None
        ext = os.path.splitext(url)[1].lower() or '.jpg'
        ext = '.jpg' if ext == '.jpeg' else ext
        n = self.counters[slug] = self.counters.get(slug, 0) + 1
        sub = 'galeria' if slug == 'galeria' else os.path.join('kepek', slug)
        rel = os.path.join(sub, '%s-%02d%s' % (slug, n, ext))
        dst = os.path.join(ROOT, 'src', 'assets', rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(src, dst)
        self.images[url] = rel
        return rel

    def file(self, url):
        url = norm(url)
        if url in self.files:
            return self.files[url]
        src = fetch(url)
        if not src:
            return None
        base = unquote(url.rsplit('/', 1)[1])
        stem, ext = os.path.splitext(base)
        stem = re.sub(r'_[0-9a-f]{13}$', '', stem).strip('-') or 'fajl'
        digest = hashlib.sha1(open(src, 'rb').read()).hexdigest()
        name, i = stem + ext.lower(), 1
        while name in self.file_hash and self.file_hash[name] != digest:
            i += 1
            name = '%s-%d%s' % (stem, i, ext.lower())
        if name not in self.file_hash:
            dst = os.path.join(ROOT, 'public', 'letoltesek', name)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copyfile(src, dst)
            self.file_hash[name] = digest
        self.files[url] = name
        return name


class Conv(HTMLParser):
    def __init__(self, slug, assets):
        super().__init__(convert_charrefs=True)
        self.slug, self.assets = slug, assets
        self.out, self.links, self.lists = [], [], []
        self.strong = self.em = self.skip = 0
        self.table = None   # list of rows while inside a table
        self.cell = None

    def w(self, t):
        (self.cell if self.cell is not None else self.out).append(t)

    def brk(self, t='\n\n'):
        """Block break; inline emphasis must not span blocks in Markdown."""
        if self.cell is not None:
            self.w(' ')
            return
        s, e = self.strong > 0, self.em > 0
        self.w((EC if e else '') + (SC if s else '') + t + (SO if s else '') + (EO if e else ''))

    def link_target(self, href):
        if not href:
            return None
        href = href.strip()
        m = re.match(r'https?://' + re.escape(OLD) + r'/+%20(https?):/+(.*)', href)
        if m:
            return '%s://%s' % (m.group(1), m.group(2))
        href = norm(href)
        if OLD in href and '/public/uploads/' in href:
            name = self.assets.file(href)
            return '/letoltesek/' + name if name else href
        m = re.match(r'https://' + re.escape(OLD) + r'(/hu/[^?#]*?)/?$', href)
        if m and m.group(1) in OLD_PATHS:
            return OLD_PATHS[m.group(1)]
        return href.replace(' ', '%20').replace('(', '%28').replace(')', '%29')

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag in ('script', 'style'):
            self.skip += 1
        elif tag == 'table':
            self.brk(); self.table = []
        elif tag == 'tr' and self.table is not None:
            self.table.append([])
        elif tag in ('td', 'th') and self.table is not None:
            self.cell = []
        elif tag in ('p', 'div', 'blockquote'):
            self.brk()
        elif tag == 'br':
            self.brk('  \n')
        elif tag in ('strong', 'b'):
            self.strong += 1
            if self.strong == 1: self.w(SO)
        elif tag in ('em', 'i'):
            self.em += 1
            if self.em == 1: self.w(EO)
        elif tag == 'a':
            self.links.append({'href': a.get('href'), 'start': len(self.cell if self.cell is not None else self.out), 'img': False})
        elif tag == 'img':
            src = a.get('src', '')
            if self.links and self.links[-1]['href'] and '/public/pic/' in self.links[-1]['href']:
                rel = self.assets.image(self.links[-1]['href'], self.slug) or self.assets.image(src, self.slug)
            else:
                rel = self.assets.image(src, self.slug)
            if self.links:
                self.links[-1]['img'] = True
            if rel:
                self.brk()
                self.w('![%s](../../assets/%s)' % ((a.get('alt') or '').strip(), rel))
                self.brk()
        elif tag == 'iframe':
            self.brk(); self.w('<%s>' % a.get('src', '')); self.brk()
        elif tag in ('ul', 'ol'):
            self.lists.append([tag, 0]); self.brk('\n\n' if len(self.lists) == 1 else '\n')
        elif tag == 'li' and self.lists:
            self.lists[-1][1] += 1
            mark = '- ' if self.lists[-1][0] == 'ul' else '%d. ' % self.lists[-1][1]
            self.brk('\n' + '   ' * (len(self.lists) - 1) + mark)
        elif re.fullmatch(r'h[1-6]', tag):
            self.brk(); self.w('### ')

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip -= 1
        elif tag == 'table' and self.table is not None:
            rows = [r for r in self.table if any(c.strip() for c in r)]
            self.table = None
            if rows:
                width = max(len(r) for r in rows)
                rows = [r + [''] * (width - len(r)) for r in rows]
                lines = ['| ' + ' | '.join(r) + ' |' for r in rows]
                lines.insert(1, '|' + ' --- |' * width)
                self.out.append('\n\n' + '\n'.join(lines) + '\n\n')
        elif tag in ('td', 'th') and self.cell is not None:
            text = re.sub(r'\s+', ' ', ''.join(self.cell)).strip().replace('|', '\\|')
            self.cell = None
            if self.table: self.table[-1].append(text)
        elif tag in ('strong', 'b') and self.strong:
            self.strong -= 1
            if not self.strong: self.w(SC)
        elif tag in ('em', 'i') and self.em:
            self.em -= 1
            if not self.em: self.w(EC)
        elif tag == 'a' and self.links:
            L = self.links.pop()
            buf = self.cell if self.cell is not None else self.out
            inner = ''.join(buf[L['start']:])
            if L['img'] or not L['href']:
                return                      # image links / anchors: keep content only
            text = re.sub(r'\s+', ' ', re.sub('[\x01-\x04]', '', inner)).strip()
            if not text:
                del buf[L['start']:]
                return
            target = self.link_target(L['href'])
            del buf[L['start']:]
            s, e = self.strong > 0, self.em > 0     # keep emphasis balanced around the link
            buf.append('[%s](%s)' % (text.replace('[', '(').replace(']', ')'), target))
        elif tag in ('ul', 'ol') and self.lists:
            self.lists.pop(); self.brk()
        elif tag in ('p', 'div', 'blockquote', 'li') or re.fullmatch(r'h[1-6]', tag):
            self.brk()

    def handle_data(self, d):
        if not self.skip:
            self.w(re.sub(r'\s+', ' ', d))


def tidy(t, title):
    t = t.replace('\xa0', ' ')
    for o, c in ((SO, SC), (EO, EC)):
        prev = None
        while prev != t:
            prev = t
            t = re.sub(o + r'(\s*)' + c, r'\1', t)                 # empty emphasis
            t = re.sub(c + r'([ \t]*)' + o, r'\1', t)              # adjacent runs on one line
            t = re.sub(o + r'([ \t]+)', r'\1' + o, t)              # whitespace outside markers
            t = re.sub(r'([ \t]+)' + c, c + r'\1', t)
            t = re.sub(o + r'(\s*\n\s*)', r'\1' + o, t)
            t = re.sub(r'(\s*\n\s*)' + c, c + r'\1', t)
    # emphasis that wraps only an image or nothing visible
    t = re.sub(SO + r'(!\[[^\]]*\]\([^)]*\))' + SC, r'\1', t)
    t = t.replace(SO, '**').replace(SC, '**').replace(EO, '*').replace(EC, '*')
    # links split into pieces with the same target, bare-URL links
    prev = None
    while prev != t:
        prev = t
        t = re.sub(r'\[([^\]]*)\]\(([^)]+)\)\[([^\]]*)\]\(\2\)', r'[\1\3](\2)', t)
    t = re.sub(r'\[(https?://[^\]\s]+)\]\(([^)]+)\)', lambda m: '<%s>' % m.group(2), t)
    t = re.sub(r'^###[ #*]*$', '', t, flags=re.M)                  # empty headings
    t = re.sub(r'^### \*\*(.*?)\*\*\s*$', r'### \1', t, flags=re.M)
    t = re.sub(r'[ \t]+\n', lambda m: '  \n' if m.group(0).startswith('  ') else '\n', t)
    t = re.sub(r'(  \n)+\n', '\n\n', t)
    t = re.sub(r'\n\n(  \n)+', '\n\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t).strip()
    # the old pages repeat their title as the first bold line
    lines = t.split('\n')
    while lines and re.sub(r'[*#\s]', '', lines[0]).lower() in (
            '', re.sub(r'\s', '', title).lower(), 'galéria', 'események', 'névjegy',
            'ösztöndíjak,kitüntetések', 'hírek,aktualitások'):
        lines.pop(0)
    return '\n'.join(lines).strip() + '\n'


def main():
    assets = Assets()
    out_dir = os.path.join(ROOT, 'src', 'content', 'oldalak')
    os.makedirs(out_dir, exist_ok=True)
    portrait = fetch('https://%s/public/pic/main_page/main_pic_0178133cdd17b01c79e622b4ef5e55dd.jpg' % OLD)
    if portrait:
        shutil.copyfile(portrait, os.path.join(ROOT, 'src', 'assets', 'portre.jpg'))
    for order, (old, (slug, title)) in enumerate(PAGES.items(), 1):
        html = open(os.path.join(SCRAPE, 'html', old + '.html'), encoding='utf-8').read()
        i = html.find('<span class="title">')
        i = html.find('</span>', i) + len('</span>')
        j = html.find('<!-- Lábléc -->')
        c = Conv(slug, assets)
        c.feed(html[i:j])
        body = tidy(''.join(c.out), title)
        if slug == 'galeria':
            body = re.sub(r'!\[[^\]]*\]\([^)]*\)\s*', '', body).strip() + '\n'
        with open(os.path.join(out_dir, slug + '.md'), 'w', encoding='utf-8') as f:
            f.write('---\ntitle: "%s"\n---\n\n%s' % (title, body))
        print('%-16s %5d words' % (slug, len(body.split())))
    print('images: %d   files: %d' % (len(assets.images), len(assets.file_hash)))
    for wmsg in warnings:
        print('WARNING', wmsg)


if __name__ == '__main__':
    main()
