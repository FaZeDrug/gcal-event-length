import pathlib
from PIL import Image, ImageDraw, ImageFont

root = pathlib.Path(__file__).resolve().parents[1]
source = root / "docs" / "store-assets" / "source"
output = root / "docs" / "store-assets"
font = str(root / "extension" / "fonts" / "Inter-Regular.otf")
title_font = ImageFont.truetype(font, 42)
caption_font = ImageFont.truetype(font, 22)
border = (217, 217, 217)


def framed(name, height):
    image = Image.open(source / name).convert("RGB")
    image = image.resize((round(image.width * height / image.height), height), Image.LANCZOS)
    ImageDraw.Draw(image).rectangle([0, 0, image.width - 1, image.height - 1], outline=border, width=1)
    return image


def canvas(title, caption):
    image = Image.new("RGB", (1280, 800), "white")
    draw = ImageDraw.Draw(image)
    draw.text((64, 56), title, font=title_font, fill=(31, 31, 31))
    draw.text((64, 116), caption, font=caption_font, fill=(112, 112, 112))
    return image


screens = [
    ("box", "Durations beside every event time", "Outlined box style, shown on real Google Calendar events."),
    ("text", "Prefer plain text? Use parentheses", "Switch styles in the popup. Open Calendar tabs update instantly."),
    ("off", "Turn durations off anytime", "One switch hides every label. Your style choice is kept."),
]
for index, (state, title, caption) in enumerate(screens, 1):
    image = canvas(title, caption)
    popup, calendar = framed(f"popup-{state}.png", 520), framed(f"calendar-{state}.png", 520)
    left = (1280 - popup.width - 48 - calendar.width) // 2
    image.paste(popup, (left, 200))
    image.paste(calendar, (left + popup.width + 48, 200))
    image.save(output / f"screenshot-{index}-{state}.png", optimize=True)

image = canvas("Settings save automatically", "Show durations on or off, then pick Outlined box or Parentheses.")
popups = [framed(f"popup-{state}.png", 480) for state in ["box", "text", "off"]]
left = (1280 - sum(p.width for p in popups) - 2 * 48) // 2
for popup in popups:
    image.paste(popup, (left, 200))
    left += popup.width + 48
image.save(output / "screenshot-4-popup.png", optimize=True)

promo = Image.new("RGB", (440, 280), "white")
art = Image.open(source / "popup-box.png").convert("RGB").crop((90, 0, 510, 400))
art = art.resize((262, 250), Image.LANCZOS)
promo.paste(art, (0, 15))
chip = Image.open(source / "event-chip.png").convert("RGB")
chip = chip.resize((168, round(chip.height * 168 / chip.width)), Image.LANCZOS)
promo.paste(chip, (250, (280 - chip.height) // 2))
promo.save(output / "promo-440x280.png", optimize=True)
