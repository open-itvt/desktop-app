# Integracja z vod.itvt.xyz — deep linki

Aplikacja desktopowa iTVT rejestruje protokół `itvt://` w systemie.
Gdy aplikacja jest zainstalowana, można ją otworzyć z poziomu przeglądarki.

## Co musisz dodać na stronie `vod.itvt.xyz`

### 1. Przycisk "Otwórz w aplikacji"

Dodaj na stronie (`vod.itvt.xyz`) przycisk lub baner który przekierowuje na `itvt://open?path=/vod`:

```html
<a href="itvt://open?path=/vod" class="app-link">
  Otwórz w aplikacji iTVT
</a>
```

Jeśli używasz strony `category/other` i chcesz otworzyć konkretną sekcję:

```html
<a href="itvt://open?path=/vod">
  Otwórz bibliotekę VOD
</a>
```

Gdzie `path` może być: `/vod`, `/schedule`, `/profile`, `/settings`.

### 2. Wykrywanie braku aplikacji (fallback)

Przeglądarki nie informują czy protokół jest zarejestrowany.
`desktop-app.itvt.xyz/apps?path=/vod` radzi sobie z tym:

- Próbuje otworzyć `itvt://open?path=/vod`
- Jeśli aplikacja nie jest zainstalowana, po 2s pokazuje link do pobrania

Możesz przekierować z `vod.itvt.xyz/category/other` na:

```
https://desktop-app.itvt.xyz/apps?path=/vod
```

### 3. Obsługa User-Agent (opcjonalne)

Aplikacja desktopowa wysyła User-Agent:
```
iTVT Desktop App v2.0
```

Możesz użyć tego do ukrycia przycisku "Otwórz w aplikacji" wewnątrz samej aplikacji:

```js
if (navigator.userAgent.indexOf('iTVT Desktop App') !== -1) {
  document.querySelector('.app-link').style.display = 'none';
}
```

### 4. Przykład kompletnego kodu

```html
<script>
  function openApp(path) {
    var link = 'itvt://open' + (path ? '?path=' + encodeURIComponent(path) : '');
    window.location.href = link;
    setTimeout(function() {
      if (!document.hidden) {
        window.location.href = 'https://desktop-app.itvt.xyz/apps?path=' + encodeURIComponent(path || '');
      }
    }, 1500);
  }
</script>

<button onclick="openApp('/vod')">Otwórz w aplikacji</button>
```
