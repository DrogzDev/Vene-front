"""
Derivados web del logo de cabecera de VeneCambio.

Los originales de src/assets/branding/ no se modifican nunca: pesan
varios cientos de KB y traen mucho margen transparente, así que la app
importa estas versiones recortadas y reducidas.

- header-v2-dark.png: logo horizontal (símbolo + wordmark) tal cual,
  para fondo oscuro.
- header-v2-light.png: mismo logo con el wordmark blanco pasado a tinta
  oscura, para fondo claro. Es un derivado PROVISIONAL hasta que exista
  un logo oficial para fondo claro (el símbolo, a color, no se toca).

Uso (desde Scrapper/):  python scripts/brand-assets.py
Requiere Pillow.
"""

import colorsys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRANDING = ROOT / "src" / "assets" / "branding"
OUT = BRANDING / "generated"

# El logo v2 (símbolo + wordmark en un solo PNG) que reemplaza al
# branding anterior de la cabecera.
SOURCE = BRANDING / "venecambio_header_v2.png.png"

# Alto final del logo de cabecera: se muestra a ~46 px, así que ~2.6x.
HEADER_HEIGHT = 120
# Color del texto oscuro en modo claro (token --text-primary light).
INK = (0x11, 0x13, 0x18)
# A la izquierda de esta columna (en el original, sin recortar) está el
# símbolo, cuyo color no debe tocarse; a la derecha, el wordmark.
TEXT_START_X = 691
# Bajo este alfa, un píxel se considera parte del halo difuso y no del
# contenido "real" del logo, para no incluir cola de glow en el recorte.
VISIBLE_ALPHA_THRESHOLD = 10
# Margen que se conserva alrededor del contenido visible, para no cortar
# el glow de golpe.
CROP_MARGIN = 12


def darken_wordmark(image: Image.Image, text_start_x: int) -> Image.Image:
    image = image.copy()
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(text_start_x, width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            _, saturation, value = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if saturation >= 0.22:
                continue
            # Blanco del texto → opaco; gris del halo → se desvanece.
            t = max(0.0, min(1.0, (value - 0.35) / 0.45))
            t = t * t * (3 - 2 * t)
            pixels[x, y] = (*INK, int(a * t))

    return image


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda v: 255 if v > VISIBLE_ALPHA_THRESHOLD else 0)
    x0, y0, x1, y1 = mask.getbbox()

    return (
        max(0, x0 - CROP_MARGIN),
        max(0, y0 - CROP_MARGIN),
        min(image.width, x1 + CROP_MARGIN),
        min(image.height, y1 + CROP_MARGIN),
    )


def fit_height(image: Image.Image, bbox: tuple[int, int, int, int], height: int) -> Image.Image:
    image = image.crop(bbox)
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    header = Image.open(SOURCE).convert("RGBA")

    # Mismo recorte para las dos variantes: así ocupan exactamente el
    # mismo espacio y cambiar de tema no mueve la cabecera.
    bbox = visible_bbox(header)

    outputs = {
        "header-v2-dark.png": fit_height(header, bbox, HEADER_HEIGHT),
        "header-v2-light.png": fit_height(darken_wordmark(header, TEXT_START_X), bbox, HEADER_HEIGHT),
    }

    for name, image in outputs.items():
        path = OUT / name
        image.save(path, optimize=True)
        print(f"{path.relative_to(ROOT)}  {image.size[0]}x{image.size[1]}  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
