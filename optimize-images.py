import sys
import os

try:
    from PIL import Image
except ImportError:
    print("Pillow non è installato. Esegui:")
    print("    pip install Pillow")
    sys.exit(1)

MAX_WIDTH = 1920
QUALITY = 85


def optimize(folder):
    if not os.path.isdir(folder):
        print(f"Cartella non trovata: {folder}")
        sys.exit(1)

    jpgs = [
        f for f in os.listdir(folder)
        if f.lower().endswith((".jpg", ".jpeg"))
    ]

    if not jpgs:
        print("Nessun file JPG trovato.")
        return

    total_saved = 0

    for filename in sorted(jpgs):
        path = os.path.join(folder, filename)
        size_before = os.path.getsize(path)

        with Image.open(path) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            w, h = img.size
            if w > MAX_WIDTH:
                new_h = int(h * MAX_WIDTH / w)
                img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)

            img.save(path, "JPEG", quality=QUALITY, optimize=True)

        size_after = os.path.getsize(path)
        saved = size_before - size_after
        total_saved += saved

        print(
            f"{filename:<40} "
            f"{size_before / 1024:>7.1f} KB  →  "
            f"{size_after / 1024:>7.1f} KB  "
            f"({saved / 1024:+.1f} KB)"
        )

    print(f"\nTotale risparmiato: {total_saved / 1024:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python optimize-images.py <cartella>")
        print("Es:  python optimize-images.py assets/barbara-coveri")
        sys.exit(1)

    optimize(sys.argv[1])
