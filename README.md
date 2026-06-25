# iTVT — Desktopowa aplikacja do streamingu TV i VOD

Zintegrowana aplikacja desktopowa do oglądania telewizji na żywo i biblioteki VOD. Łączy strumienie HLS, GStreamer i API Odysee w jednym interfejsie.

## Funkcje

- **Live TV** — odtwarzanie kanałów na żywo przez GStreamer (Linux) lub embed player (Win/Mac)
- **Biblioteka VOD** — przeglądanie i wyszukiwanie filmów z kanału Odysee @itvt
- **Harmonogram EPG** — program telewizyjny z przełącznikiem Dziś/Jutro i filtrowaniem
- **Profil użytkownika** — zapisane filmy, statystyki oglądania, edycja nicku
- **Tryb jasny/ciemny** — przełączanie motywu z automatycznym zapamiętaniem
- **Wyszukiwarka** — przeszukuje kanały, programy EPG i bibliotekę VOD
- **Zakładki** — zapisywanie filmów do obejrzenia później
- **Pełny ekran (F11)** — ukrywa interfejs na czas oglądania
- **Własne menu kontekstowe** — prawy przycisk myszy z opcjami debugowania
- **Offline screen** — niestandardowy ekran błędu przy braku połączenia

## Architektura

```
┌─────────────────────────────────────────────────┐
│              Tauri (Rust backend)                   │
│  ┌──────────┐  ┌──────────────────────────┐      │
│  │ Proxy    │  │ GStreamer (Linux only)      │      │
│  │ :8090+   │  │ uridecodebin → jpegenc      │      │
│  │ REST API │  │ → appsink → MJPEG stream    │      │
│  └──────────┘  └──────────────────────────┘      │
│         │                                            │  
│  ┌──────┴──────────────────────────────────┐     │
│  │     WebView (Vue 3 + TypeScript)        │   │     │
│  │  - Dashboard / Live TV / VOD / EPG      │   │     │
│  │  - Odysee API (api.lbry.tv)             │   │     │
│  │  - Embed player (player-itv.itvt.xyz)   │   │     │
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

**Linux**: GStreamer dekoduje HLS → MJPEG przez lokalne proxy.
**Windows/macOS**: osadzony player (iframe) z `player-itv.itvt.xyz`.

## Wymagania systemowe

- **Linux**: GTK3, WebKitGTK, GStreamer (gst-plugins-bad do HLS)
- **Windows**: WebView2 (wbudowane w Windows 11)
- **macOS**: macOS 10.15+

## Budowanie

### Standardowo (Linux/macOS/Windows)

```bash
pnpm install
pnpm tauri build
```

### NixOS

```bash
# Budowa
bash scripts/nix/build.sh

# Uruchomienie (1 plik)
bash scripts/nix/itvt.sh

# Lub pakowanie do self-extracting .run
bash scripts/nix/package-bundle.sh
# Wynik: iTVT-2.0.0-nixos-x86_64-linux.run
```

### Skrypty

| Skrypt | Opis |
|--------|------|
| `scripts/nix/all.sh` | Buduje + pakuje .run + czyści artefakty (full pipeline) |
| `scripts/nix/build.sh` | Buduje aplikację na NixOS przez nix-shell |
| `scripts/nix/run.sh` | Uruchamia z GStreamer + nixGL |
| `scripts/nix/package-bundle.sh` | Pakuje binarkę w self-extracting .run |
| `scripts/deploy-dist.sh` | Wdraża frontend na desktop-app.itvt.xyz |
| `scripts/deploy-dist-debug.sh` | Wdraża na desktop-app-debug.itvt.xyz |

## Uruchamianie

### Linux (bezpośrednio)

```bash
pnpm tauri dev
```

### Linux (z GStreamer)

```bash
cd src-tauri/target/release
WEBKIT_DISABLE_COMPOSITING_MODE=1 \
WEBKIT_DISABLE_DMABUF_RENDERER=1 \
WEBKIT_USE_GL=software \
nix run --impure github:nix-community/nixGL -- ./desktop-app
```

### NixOS (jeden plik)

```bash
chmod +x scripts/nix/itvt.sh
./scripts/nix/itvt.sh
```

## Zależności zewnętrzne

- **Odysee / LBRY API** — `api.lbry.tv` — wyszukiwanie i lista filmów VOD
- **Odysee Thumbnails** — `thumbnails.odycdn.com` / `thumbs.odycdn.com` — miniatury filmów (przekierowuje)
- **Embed player** — `player-itv.itvt.xyz` — odtwarzacz HLS dla Windows/macOS
- **HLS source** — `video-itv.itvt.xyz` — źródło strumieni HLS
- **Google Fonts** — `fonts.gstatic.com` — czcionka Inter

## Technologie

- **Frontend**: Vue 3 (Composition API, `<script setup>`), TypeScript, Vite
- **Backend**: Rust, Tauri v2, GStreamer
- **HTTP server**: tiny_http (wbudowane proxy REST + MJPEG)
- **CI/CD**: GitHub Actions (Windows, macOS ARM+Intel, Linux x86+ARM)

## Repozytoria

- `github.com/open-itvt/desktop-app` — kod źródłowy
- `github.com/open-itvt/desktop-app-dist` — wdrożony frontend (gh-pages / Vercel)

## Licencja

MIT
