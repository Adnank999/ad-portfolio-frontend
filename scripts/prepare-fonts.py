"""Build WOFF2 fonts without changing the source Inter font's metrics or axes.

Requires fonttools[woff]; install into a development environment, never the server.
The Latin face covers the portfolio UI. The complete face preserves other scripts.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "public" / "fonts"
SOURCE = FONT_DIR / "Inter-Variable.ttf"

font = TTFont(SOURCE)
font.flavor = "woff2"
font.save(FONT_DIR / "Inter-Variable.woff2")

options = subset.Options()
options.flavor = "woff2"
# Keep normal shaping/kerning and the numeric variants used by the UI.
# The complete face above retains all original optional stylistic features.
options.layout_features += ["tnum", "lnum", "zero"]
latin = subset.Subsetter(options=options)
latin.populate(unicodes=subset.parse_unicodes(
    "U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+FEFF,U+FFFD"
))
font = TTFont(SOURCE)
latin.subset(font)
font.flavor = "woff2"
font.save(FONT_DIR / "Inter-Latin.woff2")

for path in (SOURCE, FONT_DIR / "Inter-Latin.woff2", FONT_DIR / "Inter-Variable.woff2"):
    print(f"{path.name}: {path.stat().st_size:,} bytes")
