"""Render the supplied print PDF's exterior panels, without recreating its art.

Usage: python scripts/extract-box-artwork.py /absolute/path/to/artwork.pdf
Requires pypdfium2 and Pillow. Panel coordinates live beside the web textures.
"""
import json
import sys
from pathlib import Path

import pypdfium2 as pdfium

destination = Path(__file__).resolve().parents[1] / "public/images/packaging"
spec = json.loads((destination / "artwork-source.json").read_text())
document = pdfium.PdfDocument(sys.argv[1])
page = document[spec["page"] - 1]
width, height = page.get_size()
unit = 72 / 25.4
for name, panel in spec["panels"].items():
    left, top, right, bottom = [v * unit for v in panel["bounds"]]
    bitmap = page.render(
        scale=1536 / max(right - left, bottom - top),
        crop=(left, height - bottom, width - right, top),
    )
    image = bitmap.to_pil().rotate(panel["rotation"], expand=True)
    image.save(destination / f"{name}.webp", "WEBP", lossless=True)
    print(name, image.size)
    bitmap.close()
page.close()
document.close()
