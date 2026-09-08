#!/usr/bin/env python3
"""Aktualisiert einen shields.io-Badge in der README.

Die Badges werden ueber ihren Alt-Text identifiziert, z. B. ``![Coverage](...)``.
Ersetzt wird nur die Bild-URL - eine eventuelle Verlinkung
(``[![Coverage](...)](https://...)``) bleibt dadurch erhalten.

Aufruf aus den Workflows:

    python .github/scripts/update_badge.py coverage --percent 98.7
    python .github/scripts/update_badge.py image --version 1.2.3

Exit-Code 0 in beiden Faellen; ob sich etwas geaendert hat, steht in der
Ausgabe und im Step-Output ``changed`` (fuer GITHUB_OUTPUT).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

# Ab welchem Prozentwert welche Farbe. Von oben nach unten geprueft.
COVERAGE_COLORS = [
    (95.0, "brightgreen"),
    (90.0, "green"),
    (80.0, "yellowgreen"),
    (70.0, "yellow"),
    (60.0, "orange"),
]


def shields_escape(text: str) -> str:
    """Escaping fuer den Pfad-Teil einer shields.io-URL."""
    return text.replace("_", "__").replace("-", "--").replace(" ", "_").replace("%", "%25")


def coverage_color(percent: float) -> str:
    for threshold, color in COVERAGE_COLORS:
        if percent >= threshold:
            return color
    return "red"


def badge_url(label: str, message: str, color: str) -> str:
    parts = "-".join(shields_escape(part) for part in (label, message, color))
    return f"https://img.shields.io/badge/{parts}"


def replace_badge(readme: Path, alt: str, url: str) -> bool:
    """Ersetzt die URL des Badges mit dem Alt-Text ``alt``. True bei Aenderung."""
    text = readme.read_text(encoding="utf-8")
    pattern = re.compile(r"(!\[" + re.escape(alt) + r"\]\()[^)]*(\))")
    if not pattern.search(text):
        raise SystemExit(
            f"Badge '![{alt}](...)' nicht in {readme} gefunden. "
            "Die README muss den Badge-Block enthalten."
        )
    updated = pattern.sub(lambda m: m.group(1) + url + m.group(2), text)
    if updated == text:
        return False
    readme.write_text(updated, encoding="utf-8")
    return True


def emit_changed(changed: bool) -> None:
    print(f"changed={str(changed).lower()}")
    output = os.getenv("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"changed={str(changed).lower()}\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--readme", default="README.md", help="Pfad zur README (Default: README.md)")
    sub = parser.add_subparsers(dest="kind", required=True)

    coverage = sub.add_parser("coverage", help="Coverage-Badge aktualisieren")
    coverage.add_argument("--percent", type=float, required=True)

    image = sub.add_parser("image", help="Badge der veroeffentlichten Image-Version aktualisieren")
    image.add_argument("--version", required=True)

    args = parser.parse_args(argv)
    readme = Path(args.readme)

    if args.kind == "coverage":
        percent = round(args.percent, 1)
        # Ganze Prozentwerte ohne ".0" darstellen
        message = f"{percent:g}%"
        url = badge_url("Coverage", message, coverage_color(percent))
        alt = "Coverage"
    else:
        url = badge_url("ghcr.io", args.version, "2496ed")
        alt = "Image"

    changed = replace_badge(readme, alt, url)
    emit_changed(changed)
    return 0


if __name__ == "__main__":
    sys.exit(main())
