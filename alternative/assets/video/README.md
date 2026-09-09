# Hintergrund-Videos

Lege die Videos mit **exakt diesen Dateinamen** in diesen Ordner. Die Seite bindet sie automatisch ein — kein Code-Änderung nötig.

| Dateiname | Wo es erscheint | Empfohlener Inhalt |
|---|---|---|
| `hero.mp4` | Startseite, Hero ganz oben | Drohnenflug über fertige Anlage, Montage-Szene |
| `dachsanierung.mp4` | Dienstleistungen, Karte "Dachsanierungen" | Dacharbeiten, Demontage |
| `flachdach.mp4` | Dienstleistungen, Karte "Flachdach" | Flachdach mit Unterkonstruktion |
| `schraegdach.mp4` | Dienstleistungen, Karte "Schrägdach" | Ziegel-/Blechdach-Montage |
| `speicher.mp4` | Dienstleistungen, Karte "Speichersysteme" | Speicher / Wechselrichter im Technikraum |
| `cta.mp4` | Dunkles Anfrage-Band unten auf allen Seiten | Ruhige Aufnahme, wenig Bewegung |

**Wichtig zum Hero:** Das Video auf der Startseite liegt hinter einem hellen Schleier, damit die dunkle Schrift lesbar bleibt. Unten wird es kräftiger sichtbar. Wähle dort ein eher helles, ruhiges Motiv.

**Zum `cta.mp4`:** Dieses Band ist dunkel mit weisser Schrift — hier passt auch ein dunkleres Motiv.

## Technische Empfehlungen

- **Format:** MP4 (H.264) — läuft in allen Browsern
- **Auflösung:** 1920×1080 reicht; Hero max. 2560px breit
- **Dateigrösse:** unter 5 MB pro Video (Hero max. 8 MB). Grössere Dateien machen die Seite langsam.
- **Länge:** 8–15 Sekunden, nahtlos loopbar
- **Ton:** egal — die Videos laufen stummgeschaltet (Browser-Vorgabe für Autoplay)
- **Bewegung:** ruhige, langsame Aufnahmen wirken hochwertiger als schnelle Schnitte. Der Text liegt über dem Video.

## Solange keine Videos da sind

Die Seite funktioniert vollständig — statt Video wird ein dunkler Violett-Verlauf angezeigt. Es entstehen keine Fehler und keine kaputten Stellen. Sobald eine Datei mit dem passenden Namen hier liegt, wird sie beim nächsten Seitenaufruf automatisch abgespielt.

## Video verkleinern (falls die Datei zu gross ist)

Mit [ffmpeg](https://ffmpeg.org/):

```
ffmpeg -i original.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 28 -preset slow -an hero.mp4
```

`-an` entfernt die Tonspur (spart Platz, Ton wird ohnehin nicht abgespielt).
Höherer `-crf`-Wert = kleinere Datei, geringere Qualität. 26–30 ist ein guter Bereich.
