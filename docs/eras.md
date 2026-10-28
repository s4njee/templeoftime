# The eras: sources, processes and palettes

Story 1.7. For each look this family builds:
- what it was, when, and how it was made;
- the sources that document it;
- its palette as OKLCH stops (L, C, hue in degrees), as the effects use them.

It exists so the effects are built from the record, not from what "the seventies" means in a costume shop. Definition of done 5 needs every effect's look to be here.

**How sure this is.** Written in M0 from the author's knowledge, and checked against sources in M1. Each M0 "to verify" was settled against a museum, archive, manufacturer or journal source, cited where it is used; one, the appliance colours, is still only partly sourced and says so (**partly sourced**). The rest are standard, widely documented facts. Palettes are this family's readings of the period's documented colours, not measurements of specimens: where a palette rests on a specific source, the source is named.

**What is never copied.** A specific artwork, poster, logo, character, typeface, product design or trademarked pattern. Patterns are generated from a style's vocabulary (its shapes, rules and colours), and each effect's notes say which originals the style is known from.

## Art Deco and Streamline (1920s–30s)

- **What.** The decorative style named for the 1925 Paris _Exposition internationale des arts décoratifs et industriels modernes_. Its geometry is stepped forms, chevrons, zigzags, fans and sunbursts. Its materials are gilt, lacquer, chrome, inlaid wood, Bakelite and pressed and etched glass. In the 1930s it streamlined into Streamline Moderne: speed lines, rounded corners and chrome strips borrowed from trains and aircraft.
- **Names and revivals.** The term "Art Deco" was popularised by Bevis Hillier's _Art Deco of the 20s and 30s_ (1968). The style was revived twice. Barbara Hulanicki's Biba began as a mail-order business in 1963 and opened its first London shop in 1964; it closed in 1975. "Big Biba" filled the 1930s Derry & Toms building on Kensington High Street from September 1973, with Deco-revival interiors; the London Museum calls its decor old-Hollywood opulence ([London Museum, "Inside the Big Biba department store"](https://www.londonmuseum.org.uk/collections/london-stories/inside-big-biba-department-store/)). Miami Beach's Art Deco district was listed on the US National Register of Historic Places in May 1979. Leonard Horowitz, a designer and co-founder of the Miami Design Preservation League, gave its buildings their pastel palette in the late 1970s and 80s ([National Park Service, "Color Pallets: Saving Buildings from Demolition"](https://www.nps.gov/articles/000/color-pallets-saving-buildings-from-demolition.htm)).
- **The sunburst.** A rising sun of tapered rays, on doors, radio grilles, lift panels and gates. Its popularity is often tied to the Egyptian revival after the opening of Tutankhamun's tomb (1922).
- **Effects:** `sunburst`, `hello`, `deco-frame`, `gold-leaf`, `streamline`, `etched-glass`, `miami-deco`.
- **Palettes:**
  - Gold on black: ray (0.80, 0.12, 85), ground (0.16, 0.01, 80).
  - Jade and gold: ground (0.32, 0.07, 165).
  - Miami: rays (0.86, 0.07, 190) on (0.74, 0.09, 0).

## The 1960s

- **Op art.** Painting built from regular patterns that make the eye see motion, swelling or vibration: Bridget Riley's black-and-white stripe and curve paintings (from 1961), Victor Vasarely's grids. The Museum of Modern Art's exhibition _The Responsive Eye_ (curated by William Seitz, 25 February to 25 April 1965) brought the name to the public ([MoMA press release, 1965](https://www.moma.org/docs/press_archives/3439/releases/MOMA_1965_0015_14.pdf)). A safety case before a style: see docs/safety.md.
- **Pop art and Ben-Day dots.** Benjamin Day patented his shading medium in 1879: printed dots of one ink in flat areas, which comic books used for decades. Roy Lichtenstein enlarged them into paintings: _Look Mickey_ (1961) is his first with Ben-Day dots, used sparingly, and he stencilled them by hand from 1962, with heavy black contours and flat primaries ([National Gallery of Art, "An Eye for Art: Roy Lichtenstein"](https://www.nga.gov/content/dam/ngaweb/Education/learning-resources/an-eye-for-art/AnEyeforArt-RoyLichtenstein.pdf)). A comic's colourist chose a few tints of each ink, a light and a heavy screen or solid, so its colours are flat.
- **Process printing.** Four-colour offset: cyan, magenta, yellow and black plates, each a halftone screen. The traditional screen angles keep the strong inks 30° apart: cyan 15°, magenta 75°, black 45°, and yellow, the faintest, at 0°. Overlapping screens then form small rosettes rather than a moiré. This is one traditional set; C 105°, M 75°, Y 90°, K 45° is the same set turned, and some shops swap magenta and black. Dot gain, the spread of an ink dot into absorbent paper, is largest at the mid-tones: about 26–30% at a 50% tint on newsprint, nearer 20% on coated offset stock. The newspaper aim is 30% ± 4% at 50% ([Printing Industries of America, "An Analysis of the Current Status of Process Control for Color Reproduction in Newspapers", 2011](https://www.printing.org/publication/t110001); ISO 12647-3 for coldset newsprint, as the ICC's [IFRA26 characterisation](https://registry.color.org/cmyk-registry/ifra26)). `offset-print`'s newsprint gain is 28%, its uncoated 15% and its coated 8%.
- **Screen print.** Silkscreen: each colour a separate pass through a stencilled mesh, so colours misregister and coverage varies with the squeegee. Andy Warhol's photo-silkscreens, from the summer of 1962 (the Marilyns after August), made the misregistration part of the image ([The Andy Warhol Museum, "Andy Warhol's Life: 1960s"](https://www.warhol.org/andy-warhols-life/1960s/)).
- **Swiss style.** The International Typographic Style: grids, sans serifs, asymmetric layouts. Josef Müller-Brockmann's _Grid Systems in Graphic Design_ (1981) is its manual, written after the fact. A layout system, not an effect (plan 4.5).
- **Space age.** Moulded plastic and chrome in organic curves: Eero Saarinen's Tulip chair (1957), Verner Panton's Panton chair (designed 1959–60, produced from 1967 by Vitra and sold by Herman Miller; [Vitra, Panton Chair Classic factsheet](https://static.vitra.com/media/asset/177935/storage/master/download/Factsheet%2520Panton%2520Chair%2520Classic-EN.pdf)), Pierre Cardin's 1964 _Cosmos_ collection.
- **Psychedelic poster lettering.** San Francisco concert posters, 1966–68: type swollen and warped to fill a shape, often in vibrating complementary colours. Wes Wilson's Fillmore posters are the standard examples.
- **Effects:** `offset-print`, `pop-dots`, `screen-print`, `pop-outline`, `op-art`, `space-age`, `poster-lettering`.
- **Palettes:** `screen-print`'s ink sets are its own (src/effects/screen-print/index.ts): bright flat inks over a dark key, a warm gig-poster set, and one colour with black. `pop-dots` prints the process inks.
- **Palettes:** process inks are fixed by the press (`src/gpu/print/print.ts`, as transmittances). Pop's flat primaries are the inks themselves.

## The 1970s

- **Supergraphics.** Huge stripes, arcs and letters painted across walls, floors and ceilings, wrapping around corners and ignoring the architecture. Barbara Stauffacher Solomon's work at The Sea Ranch (from 1966) is the origin usually cited.
- **Kitchen and appliance colours** (**partly sourced**). Coppertone (from about 1964) and Avocado (about 1966) were appliance makers' names. GE's gold was "Harvest", often remembered as "Harvest Gold", which was Kohler's fixture name from about 1968; Maytag's was "California Gold". They were used by GE, Frigidaire, Maytag, Whirlpool and Kohler. "Burnt Orange" was not an appliance name: Kohler's orange was "Tiger Lily". These come from collectors' records, not catalogues; period advertisements are the source to find.
- **The disco ball.** A mirror ball: a sphere of small flat mirror tiles under a spotlight, each throwing a spot that sweeps the room as it turns. Older than disco, and the emblem of its clubs in the late 1970s.
- **The lava lamp.** Edward Craven Walker's Astro lamp (1963): coloured wax in a liquid, heated from below. It rises when warm, cools at the top and sinks: convection made visible.
- **Type.** Rounded, heavy display faces with multiple outlines and drop shadows, and rainbow stripes running through the letters in brown, orange and gold.
- **Photographs.** Colour prints of the era fade unevenly, one dye before another. Henry Wilhelm's _The Permanence and Care of Color Photographs_ (1993) is the standard record; its chapters were not read here, and the figures below come from his and others' journal papers.
  - **In the dark** (an album), cyan was the weakest dye of the 1970s chromogenic papers. Wilhelm wrote that Kodak's Ektacolor 74 RC prints "will pass the suggested limits of deterioration in less than 10 years" in the dark at room temperature ([Wilhelm, "Monitoring the Fading and Staining of Color Photographic Prints", JAIC 21(1), 1981](https://cool.culturalheritage.org/jaic/articles/jaic21-01-003.html)). Kodak's own natural-ageing study predicts about 8.5 years to a 10% cyan loss at 24°C for Ektacolor 37 RC, the same dye set. Magenta and yellow need several decades for a 0.1 change in density, and blue density rises in the whites, a yellowish stain ([Anderson and Ellison, "Natural Aging of Photographs", JAIC 31(2), 1992](https://cool.culturalheritage.org/jaic/articles/jaic31-02-005_4.html)). Cyan goes first and yellow second, so prints drift red, then magenta.
  - **In the light** (on display), the weakest dye has tended to be magenta, so prints drift green and blue ([Nishimura, Conservation DistList, 1996](https://cool.culturalheritage.org/byform/mailing-lists/cdl/1996/1188.html)). Wilhelm estimates about six years on display at 200 lux and 24°C for Ektacolor 74 RC (JAIC, 1981).
  - **Not found:** a figure for years to a 20% loss. `faded-print`'s rates are set to these figures (src/gpu/photo/fade.ts).
- **Effects:** `supergraphics`, `disco-ball`, `lava-lamp`, `seventies-type`, textiles, `soft-focus`, `faded-print`.
- **Palette, seventies kitchen:**
  - Harvest gold (0.78, 0.13, 85);
  - avocado (0.6, 0.1, 115), this site's accent;
  - burnt orange (0.62, 0.15, 50);
  - coppertone brown (0.45, 0.08, 55);
  - cream (0.94, 0.03, 90).

## The 1980s

- **Airbrushed chrome lettering.** The chrome heading of album covers, arcade marquees and film posters, painted by airbrush as a reflection. A sky gradient fades to a bright horizon line across the middle of the letters, with dark ground below warming towards the bottom, and four-pointed star glints at the highlights. The horizon bends where the letters' bevels turn. Japanese airbrush illustration of the period (Hajime Sorayama's chrome figures, from the late 1970s) is the virtuoso form.
- **The sunset grid.** A banded sun sliced by horizontal gaps over a perspective grid and mountains, in violet, pink and orange. Much of what is now called "outrun" or "synthwave" is the 2010s revival's reading of 80s game and film imagery. The name comes from Sega's 1986 game _Out Run_, which is not the source of the look. The notes say which parts are of the period.
- **Memphis.** The Milan design group founded by Ettore Sottsass. Its first exhibition opened on 18 September 1981 at Arc '74 in Milan, with 55 objects; Sottsass left in 1985 and the group dissolved in 1988 ([Domus, "Memphis"](https://www.domusweb.it/en/movements/memphis.html)). Its vocabulary: squiggles, confetti, terrazzo flecks, zigzags and dots on laminate; clashing pastels against black and primaries; solid geometric shapes. Barbara Radice's _Memphis: Research, Experiences, Results, Failures and Successes of New Design_ (1984) is the group's own account. Sottsass's Bacterio laminate pattern (designed 1978 for Abet Laminati, before Memphis, in his Studio Alchymia years; [The Met, "Bacterio"](https://www.metmuseum.org/art/collection/search/759731)) is the best-known pattern, and is **not** reproduced.
- **Neon.** Georges Claude showed the neon lamp in Paris in 1910; neon signs spread through the 1920s and 30s and came back as decoration in the 1980s. A sign is a glass tube bent to shape and filled with gas: neon glows red-orange, and argon with mercury blue. Other colours come from phosphors on the inside of the glass. Unlit joining runs are painted over (blockout). Rudi Stern's _Let There Be Neon_ (1979) describes the craft.
- **Laser backdrops.** The portrait studio's laser background, thin coloured beams fanning across a dark field, used in school and studio portraits from the mid-1980s.
- **Glowing grid lines.** The backlit, glowing edge lines of early computer-generated film imagery, _Tron_ (1982) being the famous case.
- **The airbrush.** A small spray gun fed by compressed air, dating from the late nineteenth century and at its height as an illustration tool in the 1970s and 80s. Gradients are built from many passes, more at the dark end, and every hard edge is a frisket, a mask of low-tack film cut with a knife and lifted after spraying. Seen close, thin spray is droplets.
- **Effects:** `airbrush`, `chrome-type`, `outrun`, `memphis`, `neon-sign`, `laser-backdrop`, `glow-grid`.
- **Palettes, chrome-type's horizons:**
  - Sunset: sky top (0.32, 0.14, 280), sky low (0.78, 0.13, 25), line (0.98, 0.03, 80), ground high (0.16, 0.03, 40), ground low (0.62, 0.14, 55).
  - Steel: sky (0.42, 0.06, 250) to (0.88, 0.03, 240), ground (0.18, 0.01, 250) to (0.55, 0.02, 250).
  - Gold: sky (0.45, 0.10, 70) to (0.90, 0.10, 90), ground (0.20, 0.05, 60) to (0.62, 0.13, 75).
- **Palette, Memphis:**
  - pink (0.82, 0.1, 0);
  - mint (0.86, 0.08, 165);
  - yellow (0.9, 0.15, 100);
  - cobalt (0.45, 0.18, 265);
  - black (0.15, 0, 0);
  - white (0.98, 0, 0).

## The 1990s

- **Translucent plastic.** Coloured, see-through cases: Apple's iMac G3 (1998, "Bondi Blue") and the translucent consoles and handhelds that followed. Internal parts and light show through a tinted, slightly frosted shell.
- **Raytraced chrome and lens flares.** The 3D logo of the early-90s home computer: extruded and bevelled chrome or glass over a checkerboard and a gradient sky, with a lens flare. POV-Ray (1991), Bryce (1994) and Kai's Power Tools made it a look.
- **Grunge typography.** Distressed, photocopied, overprinted and cropped type, illegible on purpose. David Carson's _Ray Gun_ (from 1992) and _The End of Print_ (with Lewis Blackwell, 1995) are the sources.
- **Confetti and brush patterns.** Brush strokes and confetti shapes in teal, purple and magenta on white, everywhere in the early 90s. The famous example is a paper cup design (1991) that is **not** reproduced.
- **Photocopied zines and flyers.** Xerography, Chester Carlson's process (1938), reached offices as plain-paper copiers from the Xerox 914 (1959). By the 1980s and 90s cheap copiers made the punk and riot grrrl zine and the club flyer: a copy thresholds every grey to toner or paper, each generation blurs and skews a little, and a dirty drum streaks. A copy of a copy is the look.
- **Web 1.0.** Tiled background images, bevelled buttons, marquees, visitor counters and starfield backdrops, from the first graphical browsers (Mosaic, 1993; Netscape Navigator, 1994) and the free home-page hosts.
- **Screensavers.** 3D Pipes, 3D Maze, 3D Flying Objects and 3D Text shipped with Windows NT 3.5 (1994), written by the OpenGL team to show it off, and came to Windows 95 after ([Raymond Chen, "The Old New Thing", 11 June 2024](https://devblogs.microsoft.com/oldnewthing/20240611-00/?p=109881)).
- **Effects:** `candy-plastic`, `raytraced-logo`, `grunge-type`, `photocopy`, `confetti-brush`, web 1.0 study, `screensaver`, `holo-sticker`.
- **Palette, nineties confetti:**
  - teal (0.62, 0.11, 195);
  - purple (0.45, 0.17, 300);
  - magenta (0.6, 0.22, 345);
  - yellow (0.88, 0.15, 95);
  - on white (0.98, 0, 0).
