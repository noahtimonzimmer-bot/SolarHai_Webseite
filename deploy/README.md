# Veroeffentlichen

## Warum Aenderungen auf dem Handy spaeter erschienen

nginx hat für HTML, CSS und JS keinen `Cache-Control`-Header mitgeschickt. Ohne
diesen Header entscheidet der Browser selbst, wie lange er eine Datei behält —
üblich sind 10 % der Zeit seit `Last-Modified`, und in dieser Zeit fragt er den
Server überhaupt nicht mehr. Am Rechner fiel das nicht auf, weil die geöffneten
Entwicklerwerkzeuge den Cache umgehen.

Zwei Bausteine lösen das:

1. **`?v=...` hinter CSS und JS** in allen HTML-Seiten. Eine neue Fassung
   bekommt eine neue Adresse und wird deshalb sofort geladen.
2. **`nginx-cache.conf`**: HTML wird jedes Mal geprüft, CSS und JS dürfen dank
   Versionsstempel lange im Cache bleiben.

## Einmalig auf dem VPS einrichten

```bash
sudo nano /etc/nginx/sites-available/solarhai.ch   # Inhalt von nginx-cache.conf in server{} einfuegen
sudo nginx -t && sudo systemctl reload nginx
```

Prüfen:

```bash
curl -sI https://solarhai.ch/ | grep -i cache-control          # no-cache
curl -sI https://solarhai.ch/assets/style.css | grep -i cache  # max-age=31536000
```

## Bei jeder Änderung an CSS oder JS

Den Versionsstempel in allen Seiten hochzählen, sonst behalten Besucher die
alte Fassung:

```bash
grep -rl '?v=' *.html alternative/*.html | xargs sed -i 's/?v=20260909/?v=20260910/g'
```

Danach wie gewohnt auf den Server bringen und einmal prüfen:

```bash
curl -s https://solarhai.ch/ | grep -o 'style.css?v=[0-9]*'
```
