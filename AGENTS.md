# Zasady pracy

## Branche
- **main** — tylko stabilne zmiany. Debug features NIGDY nie trafiają na main.
- **debug** — zmiany testowe, debug features, eksperymentalne.

## Commity
- Na main commitujemy TYLKO to co jawwnie powiedziane.
- Debug features (wizualne wskaźniki, logowanie, testy) TYLKO na branchu debug.

## Deploy
- `deploy-dist.sh` → deploy na **main** branch repozytorium dist.
- `deploy-dist-debug.sh` → deploy na **debug** branch repozytorium dist.
- Nie robimy deploy na oba naraz, chyba że wyraźnie polecone.

## Program data
- Programy w MOCK_UPCOMING/MOCK_EPG/MOCK_CHANNELS_DATA muszą być spójne (te same tytuły, godziny).
- Konwencja nazw: "Nocne Kino", nie "Kino Nocne".

## Odysee / VOD
- Slug Oliwier Stream: "o-stream", NIE "oliwier_stream".
- Search w TopBar musi przeszukiwać kanały + EPG + VOD (Odysee API).

## Zasada ogólna
Jeśli powiem "na debug" lub "dla debug", to znaczy:
1. Commit na branch **debug** (nie main)
2. Deploy przez `deploy-dist-debug.sh`
Równoczesny deploy na main + debug robię TYLKO na wyraźne polecenie.
