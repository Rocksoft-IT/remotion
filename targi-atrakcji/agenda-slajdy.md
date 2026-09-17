# Slajdy sceniczne: Targi Atrakcji Śląska Cieszyńskiego

**Wydarzenie:** czwartek 24.09.2026, 10:00 do 17:00, Konfero, ul. Skoczowska 134, Ustroń
**Przeznaczenie:** ekran sceny w dniu targów (pętla informacyjna + slajdy przejściowe)
**Format docelowy:** 1920 × 1080, 30 fps, Remotion
**Dane do kodu:** `slides.ts` w tym samym folderze (ten dokument to warstwa redakcyjna, plik .ts to warstwa danych)
**Wersja:** szkic 1, 10.09.2026

---

## 1. Jak to jest zbudowane

Dzień dzieli się na 6 bloków. Każdy blok to w Remotion osobna kompozycja, żeby dało się je odtwarzać niezależnie z pulpitu operatora sceny:

| Blok | Godziny | Kompozycja | Tryb odtwarzania |
|---|---|---|---|
| A. Rejestracja | 10:00–11:00 | `LoopRejestracja` | pętla, ok. 90 s |
| B. Otwarcie | 11:00–11:30 | `BlokOtwarcie` | ręczne przewijanie |
| C. Prelekcje I | 11:30–13:00 | `BlokPrelekcjeI` | ręczne, slajd przed każdą prelekcją |
| D. Przerwa | 13:00–14:00 | `LoopPrzerwa` | pętla z zegarem odliczającym |
| E. Prelekcje II i panel | 14:00–15:30 | `BlokPrelekcjeII` | ręczne |
| F. Stoiska i zakończenie | 15:30–17:00 | `LoopNetworking` | pętla, ok. 120 s |

Zasada redakcyjna dla ekranu scenicznego: maksymalnie 7 słów w tytule, maksymalnie 3 punkty na slajdzie, nazwisko prelegenta zawsze większe od tytułu prelekcji. Tekst musi być czytelny z 15 metrów, więc minimalny rozmiar to ok. 32 px w skali 1080p.

---

## 2. Oprawa

Kolory z identyfikacji targów (plik `Logo Targi Atrakcji/Kolorystyka.png`):

- **Beskidzki Granat** `#092442`, tło główne
- **Słońce nad Równicą** `#F3721C`, akcent, godziny, podkreślenia
- **Poranna Mgła** `#ECEFF3`, tekst na granacie i tła jasnych slajdów

Logo: `Logo Targi Atrakcji/svg/Logo_białe.png` na granacie, `Logo_granat.png` na jasnym tle. Znak (`Znak_primary.png`) jako sygnet w prawym dolnym narożniku na wszystkich slajdach poza slajdem tytułowym.

Do ustalenia z Astrid: krój pisma. Do czasu decyzji w danych stoi Inter (bezpieczny zamiennik, wariant Bold do tytułów, Regular do treści).

---

## 3. Typy slajdów

| Typ | Rola |
|---|---|
`hero` | slajd tytułowy wydarzenia
`agenda` | cały program dnia na jednym ekranie
`sekcja` | przerywnik otwierający blok, duży napis
`prelegent` | zdjęcie, nazwisko, firma, tytuł prelekcji, godzina
`nastepny` | „za chwilę na scenie", grzeje publiczność w trakcie przejść
`panel` | temat panelu i skład, cztery kafle
`patroni` | patronat honorowy i patronaty medialne
`partnerzy` | pętla logotypów wystawców i partnerów
`praktyczne` | wifi, catering, strefa VIP, mapa stoisk
`przerwa` | zegar odliczający do powrotu na scenę
`showcase` | demo AI Rocksoft, transkrypcja i podsumowanie panelu na żywo
`zamkniecie` | podziękowania, QR do ankiety, zapowiedź kolejnej edycji

---

## 4. Blok A: rejestracja, 10:00–11:00

Pętla puszczana od 9:30, żeby pierwsi wystawcy i goście widzieli, że ekran żyje.

**A1 `hero`** (8 s)
- Nadtytuł: I Targi Atrakcji Śląska Cieszyńskiego
- Tytuł: Region, który sprzedaje się razem
- Data i miejsce: 24 września 2026 · Konfero, Ustroń

**A2 `praktyczne`** (10 s) — Zaczynamy o 11:00
- Rejestracja i kawa powitalna do 11:00
- Otwarcie konferencji: 11:00, sala główna
- Stoiska wystawców otwarte cały dzień

**A3 `agenda`** (14 s) — Program dnia
| 10:00 | Rejestracja i kawa powitalna |
| 11:00 | Otwarcie konferencji |
| 11:30 | Prelekcje, część I |
| 13:00 | Przerwa i networking |
| 14:00 | Prelekcje, część II i panel |
| 15:30 | Rozmowy przy stoiskach |
| 17:00 | Zakończenie |

**A4 `patroni`** (10 s) — Patronat honorowy
- Burmistrz Ustronia, Burmistrz Wisły, Burmistrz Skoczowa
- Patronaty medialne: *do potwierdzenia (Kronika Beskidzka, Śląska Organizacja Turystyczna, Radio Bielsko)*

**A5 `partnerzy`** (12 s) — Wystawcy i partnerzy
- Siatka logotypów, 4 × 3, przewijana jeśli wystawców jest więcej niż 12
- Źródło danych: lista wystawców z rejestru sprzedaży stoisk (Piotr)

**A6 `praktyczne`** (10 s) — Na miejscu
- Wifi: *nazwa sieci i hasło do uzupełnienia od Konfero*
- Kawa i przekąski: hol główny
- Strefa VIP: piętro, dla gości z identyfikatorem
- QR: program dnia i lista wystawców

Pętla wraca do A1. Łącznie ok. 64 s.

---

## 5. Blok B: otwarcie, 11:00–11:30

**B1 `sekcja`** (6 s) — Otwarcie konferencji
**B2 `prelegent`** — Aneta Legierska-Bujok, Dyrektor Regionalnego Ośrodka Kultury w Bielsku-Białej, prowadzenie wydarzenia
**B3–B5 `prelegent`** — wystąpienia patronów honorowych, po 5 minut
- Burmistrz Ustronia: *imię i nazwisko do uzupełnienia*
- Burmistrz Wisły: *do uzupełnienia*
- Burmistrz Skoczowa: *do uzupełnienia*

Uwaga operatorska: slajd patrona wyświetlamy w momencie wejścia na scenę, nie wcześniej. Jeśli któryś z patronów nie dojedzie, slajd pomijamy bez konsekwencji dla reszty bloku.

---

## 6. Blok C: prelekcje część I, 11:30–13:00

Trzy slajdy prelegentów, każdy poprzedzony slajdem `nastepny`. Między prelekcjami wchodzą 5-minutowe wystąpienia pakietu PARTNER: dla nich osobny typ slajdu, żeby publiczność widziała różnicę między treścią merytoryczną a wystąpieniem partnera.

**C1 `nastepny`** (6 s) — Za chwilę: AI w branży eventowej i hotelarskiej

**C2 `prelegent`** — 11:30, **Piotr Czyż**, Rocksoft
Tytuł: Sztuczna inteligencja w branży eventowej i hotelarskiej
Trzy punkty na ekran (z jego szkicu prelekcji):
- Więcej w krótszym czasie: gdzie AI realnie podnosi rentowność
- Prezes z AI wypiera prezesa bez AI: kwestia czasu, nie mody
- Mapowanie procesów: znajdź nudne, powtarzalne i błędogenne

**C3 `partner`** (5 min slot) — wystąpienie partnera: *nazwa do uzupełnienia po sprzedaży pakietów*

**C4 `nastepny`** (6 s) — Za chwilę: Od atrakcji do doświadczeń

**C5 `prelegent`** — 12:00, **Ewa Gardyna**, Coachini w górach
Tytuł: Od atrakcji do doświadczeń, jak zmieniają się potrzeby współczesnych ludzi
Punkty: *do uzupełnienia przez prelegentkę, 3 hasła maksimum*

**C6 `partner`** (5 min slot) — *do uzupełnienia*

**C7 `nastepny`** (6 s) — Za chwilę: Programy unijne dla agroturystyki

**C8 `prelegent`** — 12:30, **Michał Bartczak**, BLDG
Tytuł: Programy unijne wspierające rozwój agroturystyki
Punkty: *do uzupełnienia przez prelegenta*

Bilans czasu: 3 × 25 min = 75 min, plus dwa slajdy partnerskie po 5 min = 85 min, 5 min zapasu do 13:00.

---

## 7. Blok D: przerwa, 13:00–14:00

**D1 `przerwa`** (pętla) — Przerwa i networking
- Duży zegar odliczający do 14:00, cyfry w kolorze akcentu
- Powrót na scenę: 14:00, panel i część II prelekcji
- Kawa i lunch: *model cateringu do potwierdzenia, food trucki lub kuchnia Konfero*
- Stoiska wystawców otwarte

**D2 `partnerzy`** (12 s) — przewijana siatka logotypów, przeplatana z D1
**D3 `praktyczne`** (10 s) — Zapisz się na rozmowę przy stoisku, QR do listy wystawców

Uwaga: to najdłuższa pętla dnia i najczęściej fotografowany ekran. Warto trzymać na niej logotypy partnerów premium, bo to jest realna wartość pakietu z LED.

---

## 8. Blok E: prelekcje część II i panel, 14:00–15:30

**E1 `nastepny`** (6 s) — Za chwilę: *temat slotu 4*

**E2 `prelegent`** — 14:00, **slot wolny nr 4**
Rekomendacja z analizy luk w agendzie: „Jak sprzedać swoją atrakcję hotelowi, pakiety, prowizje, umowy". To dokładnie ta transakcja, po którą ludzie przyszli na targi.
Kogo zaprosić: dyrektor sprzedaży dużego obiektu (Uzdrowisko Ustroń, Hotel Olympic / CSR Zawodzie, COS OPO Szczyrk).
Status: **do pozyskania, właściciel Edwin**

**E3 `nastepny`** (6 s) — Za chwilę: *temat slotu 5*

**E4 `prelegent`** — 14:20, **slot wolny nr 5**
Rekomendacja: „Czego naprawdę szuka klient korporacyjny, wyjazdy firmowe i integracje w Beskidach". Głos strony popytu, którego w agendzie nie ma.
Kogo zaprosić: agencja eventowa obsługująca korporacje, Centrum Kongresowe Belweder.
Status: **do pozyskania, właściciel Edwin**

**E5 `panel`** — 14:45, panel dyskusyjny (45 min)
Temat: Jak sprawić, żeby turysta został drugi dzień?
Wariant ostrzejszy, jeśli chcemy dyskusji a nie prezentacji dorobku: Czy Śląsk Cieszyński potrafi sprzedawać się razem?
Skład (4 kafle na slajdzie): przedstawiciele Ustronia, Wisły i Skoczowa, instytucja kultury (Zamek Cieszyn lub Muzeum Śląska Cieszyńskiego), przedsiębiorca (hotel lub duża atrakcja).
Moderacja: Aneta Legierska-Bujok.
Status składu: **do domknięcia**

**E6 `showcase`** — 15:25, po panelu: AI podsumowuje panel na żywo
Transkrypcja i podsumowanie dyskusji generowane w trakcie panelu, wyświetlone na ekranie zaraz po jego zakończeniu. Pokaz możliwości Rocksoft w praktyce.
Status: **decyzja go / no-go należy do Piotra.** Plan awaryjny, jeśli no-go: slajd `nastepny` z zapowiedzią bloku stoisk. Slajd i tak zostaje w projekcie, bo jego brak nie boli, a obecność wymaga tylko podmiany treści.

---

## 9. Blok F: stoiska i zakończenie, 15:30–17:00

**F1 `sekcja`** (6 s) — Rozmowy przy stoiskach
**F2 `praktyczne`** (12 s) — Mapa stoisk, plan sali z numerami, *do uzupełnienia po planie sali od Astrid*
**F3 `partnerzy`** (pętla) — wystawcy, jeden ekran na wystawcę: logo, nazwa, numer stoiska, jedno zdanie oferty
**F4 `praktyczne`** (10 s) — Ankieta: powiedz nam, co poprawić w kolejnej edycji, QR

**F5 `zamkniecie`** (12 s, od 16:50) — Dziękujemy
- Do zobaczenia na II Targach Atrakcji Śląska Cieszyńskiego
- Patronat honorowy: burmistrzowie Ustronia, Wisły i Skoczowa
- Kontakt: kontakt@konfero.pl, +48 668 432 329
- QR: ankieta i newsletter

---

## 10. Czego brakuje, żeby to zamknąć

Slajdy są gotowe do renderu z placeholderami. Poniższe pozycje trzeba wypełnić, w kolejności pilności:

- [ ] Dwa wolne sloty prelekcji (E2, E4): temat i prelegent. Bez tego dwa slajdy dnia zostają puste. Właściciel: Edwin
- [ ] Skład panelu i potwierdzenie moderacji (E5). Właściciel: Edwin
- [ ] Imiona i nazwiska trzech burmistrzów (B3 do B5). Właściciel: Bronek
- [ ] Lista wystawców z numerami stoisk (A5, D2, F3) i plan sali (F2). Właściciele: Piotr, Astrid
- [ ] Lista wystąpień pakietu PARTNER, kto i w którym oknie (C3, C6). Właściciel: Piotr
- [ ] Punkty na slajdach Ewy Gardyny i Michała Bartczaka, po 3 hasła. Właściciel: Edwin
- [ ] Decyzja go / no-go dla showcase AI (E6). Właściciel: Piotr
- [ ] Wifi, model cateringu, potwierdzone patronaty medialne (A4, A6, D1)
- [ ] Krój pisma z identyfikacji. Właściciel: Astrid

---

## 11. Wejście do Remotion

Plik `slides.ts` eksportuje:

- `THEME`: kolory, typografia, ścieżki do logotypów
- `Slide`: unia typów slajdów, pola `id`, `kind`, `durationInFrames` i treść zależna od typu
- `blokA` … `blokF`: tablice slajdów odpowiadające sekcjom tego dokumentu
- `KOMPOZYCJE`: lista kompozycji z id, blokiem i informacją, czy blok chodzi w pętli

Szkielet po stronie Remotion, do napisania osobno:

```
Root.tsx           -> <Composition/> na każdy wpis z KOMPOZYCJE
Deck.tsx           -> <Series/> po slajdach bloku, durationInFrames z danych
slides/Hero.tsx, Prelegent.tsx, Agenda.tsx, Panel.tsx, Przerwa.tsx, Partnerzy.tsx ...
```

Jeden komponent na typ slajdu, przełączany po `slide.kind`. Zmiana treści dnia targów to wtedy edycja `slides.ts` i nic więcej. Zegar w bloku D liczy się z `useCurrentFrame` względem godziny docelowej podanej w danych, więc działa też przy renderze do pliku.
