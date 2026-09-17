# Slajdy sceniczne, I Targi Atrakcji Śląska Cieszyńskiego

Prezentacja na ekran sceny, 1920 × 1080, 30 fps, [Remotion](https://www.remotion.dev/).
Wydarzenie: 24.09.2026, Konfero, ul. Skoczowska 134, Ustroń.

**Cała treść dnia siedzi w jednym pliku: `slides.ts`.** Zmiana danych w tym pliku
zmienia podgląd i render. Nie ma drugiego miejsca, w którym trzeba coś poprawić.

---

## Start

```bash
npm install          # raz
npm run pulpit       # pulpit operatora na http://localhost:3000
```

To jest tryb pracy na targach: **żywa prezentacja w przeglądarce, nie plik wideo.**
Render do mp4 (niżej) jest opcją zapasową, na wypadek gdyby na miejscu nie było
zaufania do laptopa.

## Pulpit operatora, dwa okna

| Okno | Adres | Co robi |
|---|---|---|
| **Pulpit** | `http://localhost:3000` | sterowanie: lista bloków i slajdów, podgląd „na ekranie" i „następny", notatki operatorskie, zegar |
| **Scena** | `http://localhost:3000/scena.html` | czysty obraz 16:9 na czarnym tle, zero interfejsu — to idzie na projektor |

Ustawienie na miejscu:

1. `npm run pulpit`, otwórz `http://localhost:3000` na ekranie laptopa.
2. Kliknij **Otwórz okno sceny**, przeciągnij nowe okno na projektor (rozszerzenie
   pulpitu, nie duplikat).
3. W oknie sceny kliknij **Pełny ekran**. Kursor znika po 2,5 s bezruchu.
4. Sterujesz z okna pulpitu. Okno sceny reaguje natychmiast.

Oba okna gadają przez `BroadcastChannel`, więc synchronizacja jest lokalna
i nie wymaga sieci ani serwera stanu. Okno sceny otwarte później dociąga aktualny
stan samo.

> **Uwaga na porty.** Sceną steruje wyłącznie pulpit z `:3000`. Remotion Studio
> (`:3001`) to osobne narzędzie i z oknem sceny nie rozmawia. Jeśli okno sceny
> pokazuje w rogu pomarańczową ramkę „Brak połączenia z pulpitem", znaczy, że
> pulpit nie jest otwarty — otwórz `http://localhost:3000/`. Ramka znika przy
> pierwszym sygnale z pulpitu i nie wraca, więc w trakcie pokazu nie wskoczy
> w kadr.

**Skróty klawiszowe** (w oknie pulpitu):

| Klawisz | Działanie |
|---|---|
| `→` / spacja / PgDn | następny slajd w kolejności dnia |
| `←` / PgUp | poprzedni slajd |
| `B` | czarny ekran, np. na czas wejścia prelegenta |
| `L` | pętla ↔ zatrzymanie obrazu na slajdzie |
| `R` | odtwórz bieżące od nowa |

**Dwa tryby.** Kliknięcie **bloku** puszcza cały blok (pętle A, D, F chodzą bez
końca). Kliknięcie **slajdu** pokazuje go pojedynczo: animacja wejścia gra raz,
potem obraz zamiera i stoi tak długo, jak trzeba. Tak obsługuje się slajdy
oznaczone `manual: true` — wyświetlasz je w momencie wejścia prelegenta na scenę.
Slajdy ręczne mają na liście znaczek ✋.

Notatka z pola `note` w `slides.ts` wyświetla się operatorowi pod podglądem
(np. „decyzja go / no-go: Piotr"). Publiczność jej nie widzi.

## Podgląd deweloperski

```bash
npm run studio       # Remotion Studio na http://localhost:3001
```

Studio przydaje się przy pracy nad wyglądem slajdów: timeline, przewijanie
klatka po klatce, podgląd każdej kompozycji osobno. Na targach używa się pulpitu.

## Co gdzie jest

| Plik | Rola |
|---|---|
| `slides.ts` | **dane**: kolory, treść slajdów, czasy, bloki dnia. Jedyny plik do edycji na co dzień |
| `presenter/` | pulpit operatora i okno sceny (`@remotion/player`, Vite) |
| `agenda-slajdy.md` | warstwa redakcyjna, opis intencji każdego slajdu |
| `src/slides/*.tsx` | po jednym komponencie na typ slajdu (`hero`, `prelegent`, `panel`, …) |
| `src/Deck.tsx` | układa slajdy bloku w sekwencję, długości bierze z `durationInFrames` |
| `src/Root.tsx` | generuje kompozycje wprost z `KOMPOZYCJE` i z `deck` |
| `src/theme.ts` | krój pisma, tony (ciemny / jasny / akcent), rozmiary |
| `public/logo`, `public/foto` | logotypy i zdjęcia prelegentów (instrukcje w środku) |

## Kompozycje w Studio

- **Bloki-dnia** — sześć bloków z `KOMPOZYCJE`: `LoopRejestracja`, `BlokOtwarcie`,
  `BlokPrelekcjeI`, `LoopPrzerwa`, `BlokPrelekcjeII`, `LoopNetworking`.
- **Caly-dzien** — `PelnyDeck`, wszystkie slajdy pod rząd, do przeglądu.
- **Slajdy-pojedyncze** — każdy slajd osobno (`Slajd-c2-czyz`, …). Stąd biorą się
  slajdy ręczne (`manual: true`): operator wyświetla je pojedynczo w momencie
  wejścia prelegenta na scenę.

## Render do plików (plan B)

```bash
npm run render                    # 6 bloków do out/*.mp4
npm run render -- LoopPrzerwa     # jeden wskazany blok
npm run render -- --all           # bloki + PelnyDeck
npm run still                     # stopklatka każdego slajdu do out/still/*.png
npm run still -- c2-czyz e5-panel # wybrane slajdy
```

Pliki `Loop*.mp4` puszcza się w pętli z odtwarzacza. Pliki `Blok*.mp4` i PNG-i
pojedynczych slajdów obsługuje operator ręcznie.

## Trzy rzeczy, o których warto wiedzieć

**Placeholdery TODO są widoczne na ekranie.** Każdy string zaczynający się od
`TODO:` renderuje się jako pomarańczowa ramka „DO UZUPEŁNIENIA”. To celowe: braku
nie da się przeoczyć na próbie technicznej. `npm run todo` wypisuje wszystkie
otwarte pozycje z `slides.ts`.

**Zegar przerwy.** Blok D liczy czas do `backAtISO`. W Studio chodzi według
realnego zegara, więc 24.09 o 13:12 pokaże faktyczne 48 minut. Powyżej 6 godzin
do celu ekran pokazuje samą godzinę powrotu zamiast bezsensownego odliczania.
W pulpicie chodzi realnym czasem, więc jeśli grasz z przeglądarki, nie ma tematu.
W pliku mp4 czas startuje od momentu renderu, więc **blok D renderuj rano w dniu
targów** albo graj go z pulpitu.

**Brakujące pliki nic nie psują.** Nie ma logo → wchodzi sygnatura tekstowa. Nie
ma zdjęcia prelegenta → wchodzą inicjały. Nie ma URL do QR → wchodzi ramka
zastępcza. Render nigdy nie wywala się na braku assetu.

## Assety

```bash
node scripts/sync-assets.mjs "../Logo Targi Atrakcji"
```

Kopiuje logotypy do `public/logo` pod nazwami bez diakrytyków (Remotion serwuje
pliki wyłącznie z `public/`). Zdjęcia prelegentów wrzuca się ręcznie do
`public/foto` i wskazuje w `slides.ts` polem `photo: 'foto/nazwisko.jpg'`.

## Zmiana kroju pisma

Jedna linia w `src/theme.ts`:

```ts
const inter = loadFont('normal', { weights: [...], subsets: ['latin', 'latin-ext'] });
```

Podmieniasz `Inter` na krój z identyfikacji. `latin-ext` jest obowiązkowy, bez
niego znikają polskie znaki.

## Nowy typ slajdu

1. Dopisz wariant do unii `Slide` w `slides.ts`.
2. Dodaj komponent w `src/slides/`.
3. Dodaj `case` w `src/slides/index.tsx`.

`npm run typecheck` nie przepuści brakującego kroku 3.
