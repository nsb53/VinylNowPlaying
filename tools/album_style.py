"""Colours for the "MCM - Dynamic" theme, taken from the album cover.

palette_from_cover(url) downloads the cover, finds its main colours and maps
them onto the Mid-Century layout (page, title block, meter block, fact card,
text). Rules keep every pairing readable and tone down extremes. Returns None
when the cover has no usable colour (black and white, one flat colour), and the
theme then uses the normal Mid-Century colours.
"""
import colorsys
import io
from urllib.request import Request, urlopen

try:
    from PIL import Image
except ImportError:  # the theme falls back to the normal colours
    Image = None

MAX_COVER_BYTES = 5_000_000
USER_AGENT = "vinyl-now-playing-prototype/0.1 (local dashboard)"

# Lightness and saturation limits for the coloured blocks: no neon, no mud.
BLOCK_L = (0.32, 0.62)
BLOCK_S = (0.28, 0.72)
# How different the title block must be from the cover beside it (contrast ratio).
TITLE_COVER_CONTRAST = 1.8
# Bump when the colour rules change, so saved album palettes are made again.
PALETTE_VERSION = 2
# Two colours this close in hue (0-1 around the wheel) count as the same.
MIN_HUE_GAP = 0.07


def available():
    return Image is not None


def _hex(rgb):
    return "#{:02x}{:02x}{:02x}".format(*(max(0, min(255, round(c * 255))) for c in rgb))


def _hls(h, l, s):
    return colorsys.hls_to_rgb(h % 1.0, max(0.0, min(1.0, l)), max(0.0, min(1.0, s)))


def _luminance(rgb):
    def channel(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((_luminance(a), _luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _clamp(value, bounds):
    return max(bounds[0], min(bounds[1], value))


def _hue_gap(a, b):
    gap = abs(a - b) % 1.0
    return min(gap, 1.0 - gap)


def _readable_on(background, dark, light):
    """Whichever of the two text colours reads better on the background."""
    return dark if contrast(background, dark) >= contrast(background, light) else light


def _push_for_contrast(h, l, s, against, target, darker):
    """Moves a colour's lightness until it reaches the target contrast."""
    step = -0.02 if darker else 0.02
    for _ in range(50):
        rgb = _hls(h, l, s)
        if contrast(rgb, against) >= target:
            return rgb
        l += step
    return _hls(h, l, s)


def cover_colours(image):
    """The cover's main colours as (share, h, l, s), most common first."""
    image = image.convert("RGB")
    image.thumbnail((96, 96))
    quantised = image.quantize(colors=10, method=Image.Quantize.MEDIANCUT)
    palette = quantised.getpalette()
    total = image.width * image.height
    colours = []
    for count, index in sorted(quantised.getcolors(), reverse=True):
        r, g, b = (value / 255 for value in palette[index * 3 : index * 3 + 3])
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        colours.append((count / total, h, l, s))
    return colours


def palette_from_colours(colours):
    # Colours with real hue. Very dark, very light and grey areas don't count.
    chromatic = [c for c in colours if c[3] >= 0.12 and 0.06 <= c[2] <= 0.92 and c[0] >= 0.01]
    if not chromatic:
        return None

    average_l = sum(share * l for share, _, l, _ in colours)
    dark = average_l < 0.36

    # Pick up to three accents of different hues, favouring common, vivid colours.
    ranked = sorted(chromatic, key=lambda c: c[0] * (0.4 + c[3]), reverse=True)
    accents = []
    for colour in ranked:
        if all(_hue_gap(colour[1], other[1]) >= MIN_HUE_GAP for other in accents):
            accents.append(colour)
        if len(accents) == 3:
            break
    blocks = [(h, _clamp(l, BLOCK_L), _clamp(s, BLOCK_S)) for _, h, l, s in accents]
    # Too few distinct hues: make the rest from the main one, lighter and darker.
    base_h, base_l, base_s = blocks[0]
    if len(blocks) < 2:
        blocks.append((base_h + 0.04, _clamp(base_l - 0.16, BLOCK_L), base_s))
    if len(blocks) < 3:
        blocks.append((base_h - 0.03, _clamp(base_l + 0.14, BLOCK_L), _clamp(base_s + 0.1, BLOCK_S)))

    # The title block sits right next to the cover, so it takes the accent that
    # stands out most against the cover's main colour, and is darkened or
    # lightened if even that one is too close.
    hue = blocks[0][0]
    cover_main = _hls(colours[0][1], colours[0][2], colours[0][3])
    blocks.sort(key=lambda b: contrast(_hls(*b), cover_main), reverse=True)
    h, l, s = blocks[0]
    darker = colours[0][2] > 0.45
    for _ in range(25):
        if contrast(_hls(h, l, s), cover_main) >= TITLE_COVER_CONTRAST:
            break
        l += -0.02 if darker else 0.02
    blocks[0] = (h, _clamp(l, (0.18, 0.8)), s)

    title_hls, meter_hls, card_hls = blocks

    if dark:
        bg = _hls(hue, 0.11, min(0.3, title_hls[2] * 0.5))
        ink = _hls(hue, 0.91, 0.35)
        muted = _hls(hue, 0.72, 0.18)
    else:
        bg = _hls(hue, 0.9, min(0.38, title_hls[2] * 0.6))
        ink = _hls(hue, 0.12, 0.2)
        muted = _hls(hue, 0.34, 0.12)

    cream = _hls(hue, 0.95, 0.55)
    deep = _hls(hue, 0.11, 0.22)

    title_bg = _hls(*title_hls)
    meter_bg = _hls(*meter_hls)
    card_bg = _hls(*card_hls)
    title_ink = _readable_on(title_bg, deep, cream)
    card_ink = _readable_on(card_bg, deep, cream)

    # The current lyric line uses the meter colour, made readable on the page.
    current = _push_for_contrast(meter_hls[0], meter_hls[1], meter_hls[2], bg, 4.5, darker=not dark)

    tag_light = card_ink == cream
    card_tag = _hls(card_hls[0], 0.84 if tag_light else 0.22, 0.75)
    if contrast(card_tag, card_bg) < 3:
        card_tag = card_ink

    # The starburst on the title block: its text colour plus the card colour.
    burst_b = card_bg if contrast(card_bg, title_bg) >= 1.8 else title_ink

    return {
        "dark": dark,
        "bg": _hex(bg),
        "ink": _hex(ink),
        "muted": _hex(muted),
        "current": _hex(current),
        "titleBg": _hex(title_bg),
        "titleInk": _hex(title_ink),
        "meterBg": _hex(meter_bg),
        "cardBg": _hex(card_bg),
        "cardInk": _hex(card_ink),
        "cardTag": _hex(card_tag),
        "burstA": _hex(title_ink),
        "burstB": _hex(burst_b),
        "face": _hex(_hls(hue, 0.95, 0.4)),
        "faceInk": _hex(deep),
        "vuRed": _hex(_hls(card_hls[0], 0.45, 0.65)),
    }


def palette_from_bytes(data):
    if Image is None:
        return None
    with Image.open(io.BytesIO(data)) as image:
        return palette_from_colours(cover_colours(image))


def palette_from_cover(url, timeout=10):
    """Downloads the cover and returns its palette, or None."""
    if Image is None or not url:
        return None
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        data = response.read(MAX_COVER_BYTES + 1)
    if len(data) > MAX_COVER_BYTES:
        return None
    return palette_from_bytes(data)
