"""
Icono del launcher de Android, a partir del PNG que dejó el usuario en
android/app/src/main/ic_launcher-playstore.png.

Ese archivo tiene contaminación en las 4 esquinas: el verde exacto de
Android por defecto (#3DDC84), residuo de que el adaptive icon nunca se
rebrandeó (la app seguía con el robot verde de plantilla). El resto de
la imagen es limpio: una card oscura con el símbolo "V" en dorado/teal.
Este script recorta ese margen contaminado antes de generar nada.

Genera:
- Legacy (mipmap-*/ic_launcher.png): el cuadrado limpio, reescalado a
  pantalla completa (es opaco: el propio launcher decide si lo recorta en
  círculo o en cuadrado redondeado).
- Round (mipmap-*/ic_launcher_round.png): el mismo contenido, pero
  recortado de verdad en un círculo (máscara alfa), con algo más de
  margen para que el aro no corte las puntas de la V.
- Adaptive foreground (mipmap-*/ic_launcher_foreground.png): el cuadrado
  centrado en un lienzo transparente, ocupando la zona segura de Android
  (72/108 del canvas).
- Adaptive background: drawable/ic_launcher_background.xml pasa de la
  rejilla verde de plantilla a un color sólido (el token surface-1 de la
  app, no un color inventado para la ocasión).

También borra los .webp de plantilla (mismo nombre base que los nuevos
.png; dejarlos sería un recurso duplicado para Gradle) y el color
huérfano values/ic_launcher_background.xml (nada lo referenciaba).

Uso (desde Scrapper/):  python scripts/android-icon.py
Requiere Pillow.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "android" / "app" / "src" / "main" / "ic_launcher-playstore.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

# Margen contaminado con el verde de plantilla, medido por muestreo de
# píxeles: a 40 px de cada esquina ya no queda rastro.
CROP_INSET = 40

# Legacy: el cuadrado a pantalla completa (los launchers antiguos hacen
# su propio recorte cuadrado/circular sobre esto).
LEGACY_SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
# Margen antes del círculo en la variante "round", para que el aro no
# corte las puntas de la V.
ROUND_FILL = 0.92

# Adaptive: 108dp de canvas, zona segura de 72dp (la que Android garantiza
# visible en cualquier máscara de launcher).
ADAPTIVE_SIZES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
ADAPTIVE_SAFE_FRACTION = 72 / 108

# Fondo del adaptive icon: token --c-surface-1 (dark) de tokens.css.
ADAPTIVE_BACKGROUND = "#0D1014"


def clean_square(source: Image.Image) -> Image.Image:
    width, height = source.size
    box = (CROP_INSET, CROP_INSET, width - CROP_INSET, height - CROP_INSET)
    return source.crop(box)


def paste_centered(canvas_size: int, content: Image.Image, fill_fraction: float) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    target = round(canvas_size * fill_fraction)
    resized = content.resize((target, target), Image.LANCZOS)
    offset = (canvas_size - target) // 2
    canvas.alpha_composite(resized, (offset, offset))
    return canvas


def circular(canvas_size: int, content: Image.Image, fill_fraction: float) -> Image.Image:
    """El contenido, recortado en un círculo real (con transparencia real
    fuera de él), no solo "con más margen" dentro de un cuadrado.

    La máscara se aplica sobre el contenido YA reescalado a su tamaño
    final (target×target) y SOLO DESPUÉS se centra en el lienzo. Aplicar
    la máscara sobre el lienzo completo dejaría una media luna del
    relleno transparente (que un guardado intermedio en RGB volvería
    negro) visible dentro del círculo, porque el contenido es más chico
    que el lienzo pero el círculo iría inscrito en el lienzo entero.
    """
    target = round(canvas_size * fill_fraction)
    resized = content.resize((target, target), Image.LANCZOS)

    mask = Image.new("L", (target, target), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, target - 1, target - 1), fill=255)

    masked = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    masked.paste(resized, (0, 0), mask)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset = (canvas_size - target) // 2
    canvas.alpha_composite(masked, (offset, offset))
    return canvas


def write(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)
    print(f"{path.relative_to(ROOT)}  {image.size[0]}x{image.size[1]}  {path.stat().st_size // 1024} KB")


def remove_template_leftovers() -> None:
    for density in LEGACY_SIZES:
        for name in ("ic_launcher.webp", "ic_launcher_round.webp", "ic_launcher_foreground.webp"):
            path = RES / f"mipmap-{density}" / name
            if path.exists():
                path.unlink()
                print(f"borrado {path.relative_to(ROOT)}")

    orphan_color = RES / "values" / "ic_launcher_background.xml"
    if orphan_color.exists():
        orphan_color.unlink()
        print(f"borrado {orphan_color.relative_to(ROOT)} (color huérfano, nada lo referenciaba)")


def write_background_drawable() -> None:
    path = RES / "drawable" / "ic_launcher_background.xml"
    path.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<!-- Fondo del adaptive icon: color sólido (token surface-1),\n"
        "     no la rejilla verde de plantilla de Android Studio. -->\n"
        '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n'
        f'    <solid android:color="{ADAPTIVE_BACKGROUND}" />\n'
        "</shape>\n",
        encoding="utf-8",
    )
    print(f"escrito {path.relative_to(ROOT)}  fondo {ADAPTIVE_BACKGROUND}")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"No se encontró {SOURCE.relative_to(ROOT)}")

    source = Image.open(SOURCE).convert("RGBA")
    content = clean_square(source)

    for density, size in LEGACY_SIZES.items():
        # Opaco y a pantalla completa: el contenido ya es opaco de por sí
        # (sin transparencia), así que no hay relleno que se vuelva negro.
        legacy = content.resize((size, size), Image.LANCZOS)
        write(RES / f"mipmap-{density}" / "ic_launcher.png", legacy)

        round_icon = circular(size, content, ROUND_FILL)
        write(RES / f"mipmap-{density}" / "ic_launcher_round.png", round_icon)

    for density, size in ADAPTIVE_SIZES.items():
        foreground = paste_centered(size, content, ADAPTIVE_SAFE_FRACTION)
        write(RES / f"mipmap-{density}" / "ic_launcher_foreground.png", foreground)

    write_background_drawable()
    remove_template_leftovers()


if __name__ == "__main__":
    main()
