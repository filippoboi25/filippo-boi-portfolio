"""Controllo dell'ordine dei lavori (home e archivio).

Uso, dalla radice del progetto:
    py tools/check-order.py            # controlla index.html e lavori.html
    py tools/check-order.py <cartella> # controlla un'altra copia del sito

Il criterio unico è l'attributo data-date di ogni card (.work-card):
  - formato YYYY-MM, oppure YYYY se il mese non è noto;
  - in ciascuna pagina le card devono essere dalla più recente alla meno recente;
  - le card della home devono comparire nell'archivio e nello stesso ordine;
  - l'anno di data-date deve comparire nell'anno visibile della card d'archivio.

Esce con codice 1 se trova un errore. Tra lavori dello stesso anno senza mese
l'ordine non è verificabile dalla data: vale l'ordine scritto nell'HTML e lo
script lo riporta come "ordine confermato a mano", senza fallire.
"""

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

DATE_RE = re.compile(r"^(\d{4})(?:-(0[1-9]|1[0-2]))?$")


class CardParser(HTMLParser):
    """Raccoglie href, data-date e anno visibile di ogni a.work-card."""

    def __init__(self):
        super().__init__()
        self.cards = []
        self._current = None
        self._in_year = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        if tag == "a" and "work-card" in classes:
            self._current = {"href": a.get("href", ""), "date": a.get("data-date"), "year_text": ""}
            self.cards.append(self._current)
        elif self._current is not None and "work-card__year" in classes:
            self._in_year = True

    def handle_endtag(self, tag):
        if tag == "a":
            self._current = None
        if tag == "span":
            self._in_year = False

    def handle_data(self, data):
        if self._in_year and self._current is not None:
            self._current["year_text"] += data.strip()


def read_cards(path):
    parser = CardParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.cards


def slug(href):
    return href.rsplit("/", 1)[-1]


def check_page(name, cards, errors, warnings):
    if not cards:
        errors.append(f"{name}: nessuna card .work-card trovata")
        return
    for c in cards:
        if not c["date"] or not DATE_RE.match(c["date"]):
            errors.append(f"{name}: {slug(c['href'])} ha data-date non valida: {c['date']!r} (atteso YYYY-MM o YYYY)")
    # Tutte le coppie, non solo le card vicine: con date senza mese il confronto
    # tra vicine non basta (es. 2026-06, 2026, 2026-11 passerebbe).
    for i, a in enumerate(cards):
        for b in cards[i + 1:]:
            ma, mb = DATE_RE.match(a["date"] or ""), DATE_RE.match(b["date"] or "")
            if not (ma and mb):
                continue
            ya, yb = int(ma.group(1)), int(mb.group(1))
            newer = ya < yb or (ya == yb and ma.group(2) and mb.group(2) and int(ma.group(2)) < int(mb.group(2)))
            if newer:
                errors.append(f"{name}: {slug(a['href'])} ({a['date']}) viene prima di {slug(b['href'])} ({b['date']}), che è più recente")
            elif ya == yb and not (ma.group(2) and mb.group(2)) and b is cards[i + 1]:
                warnings.append(f"{name}: {slug(a['href'])} -> {slug(b['href'])} ({ma.group(1)}, mese non indicato)")


def main():
    # Console Windows (cp1252) o output rediretto: niente crash su caratteri non rappresentabili.
    sys.stdout.reconfigure(errors="replace")
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    home = read_cards(root / "index.html")
    archive = read_cards(root / "lavori.html")
    errors, warnings = [], []

    check_page("home", home, errors, warnings)
    check_page("archivio", archive, errors, warnings)

    # La home deve essere un sottoinsieme dell'archivio, nello stesso ordine e con le stesse date.
    pos = {slug(c["href"]): i for i, c in enumerate(archive)}
    dates = {slug(c["href"]): c["date"] for c in archive}
    last = -1
    for c in home:
        s = slug(c["href"])
        if s not in pos:
            errors.append(f"home: {s} non è nell'archivio")
            continue
        if c["date"] != dates[s]:
            errors.append(f"home: {s} ha data-date {c['date']} ma nell'archivio è {dates[s]}")
        if pos[s] < last:
            errors.append(f"home: {s} è in un ordine diverso dall'archivio")
        last = pos[s]

    # L'anno della data deve comparire nell'anno visibile in archivio (es. "2022 · 2025").
    for c in archive:
        m = DATE_RE.match(c["date"] or "")
        if m and c["year_text"] and m.group(1) not in c["year_text"]:
            errors.append(f"archivio: {slug(c['href'])} mostra '{c['year_text']}' ma data-date è {c['date']}")

    for w in dict.fromkeys(warnings):
        print("ordine confermato a mano:", w)
    for e in errors:
        print("ERRORE:", e)
    order = ", ".join(f"{slug(c['href']).removesuffix('.html')} ({c['date']})" for c in archive)
    print(f"\narchivio ({len(archive)}): {order}")
    print(f"home ({len(home)}): " + ", ".join(slug(c["href"]).removesuffix(".html") for c in home))
    if errors:
        print(f"\nControllo FALLITO: {len(errors)} errori.")
        sys.exit(1)
    print("\nControllo superato.")


if __name__ == "__main__":
    main()
