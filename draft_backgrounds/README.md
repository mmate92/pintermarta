# Draft backgrounds (first version)

The three background sketches from the first draft of the site, kept so we can go back to them:

| File | What |
|---|---|
| `fuggony-oldal.svg`, `fuggony-felso.svg` | Theatre: the original side curtain and top drape (these are the ones in use) |
| `konyvespolc.svg` | Bookshelf: seamless tile of book spines |
| `konyvtar.svg` | Library hall in perspective |
| `make-backgrounds.mjs` | Script that generated all four (`node draft_backgrounds/make-backgrounds.mjs` writes to `draft_backgrounds/generated/`) |
| `themes.css` | The CSS of the three themes and of the sketch switcher |
| `ThemeSwitcher.astro` | The bottom-right switcher component |

The complete first draft (with the working switcher) is also in git: commit `641ba0e`.
`git checkout 641ba0e -- src/styles/global.css src/layouts/Base.astro src/components` restores it.

To bring one background back: copy its SVG to `src/assets/hatter/`, copy the matching rules from
`themes.css` into `src/styles/global.css`, and add the scene `<div>`s it needs to `src/layouts/Base.astro`
(`shelves` + `dim` for the bookshelf, `hall` + `dusk` for the library).

## curtains_v2/

The second, "more realistic" curtain attempt (shaded velvet folds, rope tie-back, swagged top drape) and
its generator. It was rejected in favour of the first version, which is the one in use
(`src/assets/hatter/fuggony-oldal.svg` and `fuggony-felso.svg` are identical to the copies in this folder's parent).
