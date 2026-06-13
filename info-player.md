# Integracja embed playera z aplikacją iTVT

Aplikacja desktopowa iTVT używa embed playera (`player-itv.itvt.xyz/channels/{slug}`)
na Windows i macOS (na Linux działa GStreamer + MJPEG przez proxy).

Dla pełnej integracji (ukrycie natywnych kontrolek + sterowanie z aplikacji)
należy dodać poniższy kod na stronie `player-itv.itvt.xyz`.

---

## 1. Query parameter `?controls=false`

Aplikacja ładuje iframe z URL: `https://player-itv.itvt.xyz/channels/{slug}?controls=false`

Na stronie playera (`player-itv.itvt.xyz`) dodaj:

```html
<script>
  var params = new URLSearchParams(window.location.search);
  var hideControls = params.get('controls') === 'false';

  if (hideControls) {
    // Ukryj natywne kontrolki playera
    var video = document.querySelector('video');
    if (video) {
      video.controls = false;
      video.style.pointerEvents = 'none';
    }
    // Ukryj custom controls jeśli istnieją
    document.querySelectorAll('.controls-bar, .player-controls, .control-bar, .vjs-control-bar').forEach(function(el) {
      el.style.display = 'none';
    });
  }
</script>
```

## 2. Sterowanie przez postMessage

Aplikacja iTVT wysyła komendy do iframe przez `postMessage`.
Dodaj na stronie playera:

```html
<script>
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || !data.type) return;

    var video = document.querySelector('video');
    if (!video) return;

    switch (data.type) {
      case 'play':
        video.play().catch(function(e) {});
        break;
      case 'pause':
        video.pause();
        break;
      case 'togglePlay':
        video.paused ? video.play().catch(function(e) {}) : video.pause();
        break;
      case 'setVolume':
        if (data.volume !== undefined) video.volume = data.volume / 100;
        break;
      case 'mute':
        video.muted = data.active;
        break;
      case 'seek':
        if (data.time != null) video.currentTime = data.time;
        break;
      case 'fullscreen':
        if (data.active) {
          document.documentElement.requestFullscreen().catch(function(e) {});
        } else {
          document.exitFullscreen().catch(function(e) {});
        }
        break;
    }
  });
</script>
```

## 3. Obsługa eventów z playera do aplikacji (opcjonalne)

Player może wysyłać stan do aplikacji:

```html
<script>
  var video = document.querySelector('video');
  if (video) {
    video.addEventListener('play', function() {
      window.parent.postMessage({ type: 'playing' }, '*');
    });
    video.addEventListener('pause', function() {
      window.parent.postMessage({ type: 'paused' }, '*');
    });
  }
</script>
```

## 4. Po stronie aplikacji (LiveView.vue)

Po dodaniu powyższego kodu na `player-itv.itvt.xyz`, aplikacja będzie:
- Ładować iframe z `?controls=false`
- Wysyłać komendy play/pause/volume/fullscreen przez `postMessage`
- Odbierać eventy o stanie odtwarzacza

Daj znać jak ogarniesz to na `player-itv.itvt.xyz`, a zaktualizuję frontend aplikacji.
