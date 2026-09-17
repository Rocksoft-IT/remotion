/**
 * Targi Atrakcji Śląska Cieszyńskiego, 24.09.2026, Konfero Ustroń.
 * Dane slajdów na ekran sceny. Warstwa redakcyjna: agenda-slajdy.md w tym folderze.
 *
 * Konwencja: wszystko, co wymaga decyzji, jest oznaczone stringiem zaczynającym się
 * od "TODO:". Przed renderem: grep -n "TODO:" slides.ts
 */

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

export const THEME = {
  colors: {
    granat: '#092442',
    slonce: '#F3721C',
    mgla: '#ECEFF3',
    granatSoft: '#123256',
  },
  fonts: {
    // TODO: krój z identyfikacji targów, do potwierdzenia z Astrid. Inter to zamiennik.
    display: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  logo: {
    light: '../Logo Targi Atrakcji/png/Logo_białe.png',
    dark: '../Logo Targi Atrakcji/png/Logo_granat.png',
    mark: '../Logo Targi Atrakcji/png/Znak_primary.png',
  },
  safeArea: 96, // px w skali 1920x1080, marginesy dla widowni z tyłu sali
} as const;

export const EVENT = {
  editionLabel: 'I Targi Atrakcji Śląska Cieszyńskiego',
  date: '24 września 2026',
  dateISO: '2026-09-24',
  venue: 'Konfero, ul. Skoczowska 134, Ustroń',
  contact: 'kontakt@konfero.pl · +48 668 432 329',
  hosts: 'Patronat honorowy: Burmistrzowie Ustronia, Wisły i Skoczowa',
  mc: 'Aneta Legierska-Bujok',
} as const;

/* ------------------------------------------------------------------ typy */

type Base = {
  id: string;
  durationInFrames: number;
  /** true = slajd wyświetlany na ręczny sygnał operatora, nie w pętli */
  manual?: boolean;
  note?: string;
};

export type Slide =
  | (Base & { kind: 'hero'; overline: string; title: string; meta: string })
  | (Base & { kind: 'sekcja'; title: string; time?: string })
  | (Base & {
      kind: 'agenda';
      title: string;
      rows: { time: string; label: string; accent?: boolean }[];
    })
  | (Base & {
      kind: 'prelegent';
      time: string;
      name: string;
      org: string;
      role?: string;
      talkTitle: string;
      bullets?: string[];
      photo?: string;
      badge?: 'prelekcja' | 'prowadzenie' | 'patron' | 'partner';
    })
  | (Base & { kind: 'nastepny'; label: string; title: string; name?: string })
  | (Base & {
      kind: 'panel';
      time: string;
      title: string;
      altTitle?: string;
      moderator: string;
      seats: { name: string; org: string }[];
    })
  | (Base & {
      kind: 'patroni';
      title: string;
      honorary: string[];
      media?: string[];
    })
  | (Base & {
      kind: 'partnerzy';
      title: string;
      layout: 'grid' | 'single';
      items: { name: string; logo?: string; booth?: string; claim?: string }[];
    })
  | (Base & { kind: 'praktyczne'; title: string; items: string[]; qr?: string })
  | (Base & {
      kind: 'przerwa';
      title: string;
      backAt: string;
      backAtISO: string;
      items: string[];
    })
  | (Base & { kind: 'showcase'; title: string; lead: string; items: string[] })
  | (Base & {
      kind: 'zamkniecie';
      title: string;
      lines: string[];
      qr?: string;
    });

/* ------------------------------------------- blok A: rejestracja 10:00 */

export const blokA: Slide[] = [
  {
    id: 'a1-hero',
    kind: 'hero',
    durationInFrames: sec(8),
    overline: EVENT.editionLabel,
    title: 'Region, który sprzedaje się razem',
    meta: `${EVENT.date} · Konfero, Ustroń`,
  },
  {
    id: 'a2-start',
    kind: 'praktyczne',
    durationInFrames: sec(10),
    title: 'Zaczynamy o 11:00',
    items: [
      'Rejestracja i kawa powitalna do 11:00',
      'Otwarcie konferencji: 11:00, sala główna',
      'Stoiska wystawców otwarte cały dzień',
    ],
  },
  {
    id: 'a3-agenda',
    kind: 'agenda',
    durationInFrames: sec(14),
    title: 'Program dnia',
    rows: [
      { time: '10:00', label: 'Rejestracja i kawa powitalna' },
      { time: '11:00', label: 'Otwarcie konferencji' },
      { time: '11:30', label: 'Prelekcje, część I', accent: true },
      { time: '13:00', label: 'Przerwa i networking' },
      { time: '14:00', label: 'Prelekcje, część II i panel', accent: true },
      { time: '15:30', label: 'Rozmowy przy stoiskach' },
      { time: '17:00', label: 'Zakończenie' },
    ],
  },
  {
    id: 'a4-patroni',
    kind: 'patroni',
    durationInFrames: sec(10),
    title: 'Patronat honorowy',
    honorary: ['Burmistrz Ustronia', 'Burmistrz Wisły', 'Burmistrz Skoczowa'],
    media: ['TODO: potwierdzone patronaty medialne (Kronika Beskidzka, ŚOT, Radio Bielsko)'],
  },
  {
    id: 'a5-partnerzy',
    kind: 'partnerzy',
    durationInFrames: sec(12),
    title: 'Wystawcy i partnerzy',
    layout: 'grid',
    items: [{ name: 'TODO: lista wystawców z rejestru sprzedaży stoisk' }],
  },
  {
    id: 'a6-praktyczne',
    kind: 'praktyczne',
    durationInFrames: sec(10),
    title: 'Na miejscu',
    items: [
      'TODO: wifi, nazwa sieci i hasło od Konfero',
      'Kawa i przekąski: hol główny',
      'Strefa VIP: piętro, dla gości z identyfikatorem',
    ],
    qr: 'TODO: URL do programu i listy wystawców',
  },
];

/* --------------------------------------------- blok B: otwarcie 11:00 */

export const blokB: Slide[] = [
  { id: 'b1-sekcja', kind: 'sekcja', durationInFrames: sec(6), title: 'Otwarcie konferencji', time: '11:00' },
  {
    id: 'b2-mc',
    kind: 'prelegent',
    durationInFrames: sec(10),
    manual: true,
    badge: 'prowadzenie',
    time: '11:00',
    name: EVENT.mc,
    org: 'Regionalny Ośrodek Kultury w Bielsku-Białej',
    role: 'Dyrektor',
    talkTitle: 'Prowadzenie wydarzenia',
  },
  {
    id: 'b3-patron-ustron',
    kind: 'prelegent',
    durationInFrames: sec(10),
    manual: true,
    badge: 'patron',
    time: '11:05',
    name: 'TODO: imię i nazwisko',
    org: 'Burmistrz Ustronia',
    talkTitle: 'Wystąpienie patrona honorowego',
  },
  {
    id: 'b4-patron-wisla',
    kind: 'prelegent',
    durationInFrames: sec(10),
    manual: true,
    badge: 'patron',
    time: '11:12',
    name: 'TODO: imię i nazwisko',
    org: 'Burmistrz Wisły',
    talkTitle: 'Wystąpienie patrona honorowego',
  },
  {
    id: 'b5-patron-skoczow',
    kind: 'prelegent',
    durationInFrames: sec(10),
    manual: true,
    badge: 'patron',
    time: '11:19',
    name: 'TODO: imię i nazwisko',
    org: 'Burmistrz Skoczowa',
    talkTitle: 'Wystąpienie patrona honorowego',
  },
];

/* ---------------------------------- blok C: prelekcje część I, 11:30 */

export const blokC: Slide[] = [
  {
    id: 'c1-nastepny',
    kind: 'nastepny',
    durationInFrames: sec(6),
    label: 'Za chwilę na scenie',
    title: 'Sztuczna inteligencja w branży eventowej i hotelarskiej',
    name: 'Piotr Czyż, Rocksoft',
  },
  {
    id: 'c2-czyz',
    kind: 'prelegent',
    durationInFrames: sec(12),
    manual: true,
    badge: 'prelekcja',
    time: '11:30',
    name: 'Piotr Czyż',
    org: 'Rocksoft',
    talkTitle: 'Sztuczna inteligencja w branży eventowej i hotelarskiej',
    bullets: [
      'Więcej w krótszym czasie: gdzie AI realnie podnosi rentowność',
      'Prezes z AI wypiera prezesa bez AI: kwestia czasu, nie mody',
      'Mapowanie procesów: znajdź nudne, powtarzalne i błędogenne',
    ],
  },
  {
    id: 'c3-partner-1',
    kind: 'prelegent',
    durationInFrames: sec(8),
    manual: true,
    badge: 'partner',
    time: '11:55',
    name: 'TODO: wystąpienie partnera, pakiet PARTNER',
    org: 'TODO: firma',
    talkTitle: 'Wystąpienie partnera targów',
    note: 'Slot 5 min z pakietu PARTNER. Wizualnie odmienny od slajdu prelekcji.',
  },
  {
    id: 'c4-nastepny',
    kind: 'nastepny',
    durationInFrames: sec(6),
    label: 'Za chwilę na scenie',
    title: 'Od atrakcji do doświadczeń',
    name: 'Ewa Gardyna, Coachini w górach',
  },
  {
    id: 'c5-gardyna',
    kind: 'prelegent',
    durationInFrames: sec(12),
    manual: true,
    badge: 'prelekcja',
    time: '12:00',
    name: 'Ewa Gardyna',
    org: 'Coachini w górach',
    photo: 'foto/katarzyna-wojciechowska.jpeg',
    talkTitle: 'Od atrakcji do doświadczeń, jak zmieniają się potrzeby współczesnych ludzi',
    bullets: ['TODO: 3 hasła od prelegentki'],
  },
  {
    id: 'c6-partner-2',
    kind: 'prelegent',
    durationInFrames: sec(8),
    manual: true,
    badge: 'partner',
    time: '12:25',
    name: 'TODO: wystąpienie partnera, pakiet PARTNER',
    org: 'TODO: firma',
    talkTitle: 'Wystąpienie partnera targów',
  },
  {
    id: 'c7-nastepny',
    kind: 'nastepny',
    durationInFrames: sec(6),
    label: 'Za chwilę na scenie',
    title: 'Programy unijne dla agroturystyki',
    name: 'Michał Bartczak, BLDG',
  },
  {
    id: 'c8-bartczak',
    kind: 'prelegent',
    durationInFrames: sec(12),
    manual: true,
    badge: 'prelekcja',
    time: '12:30',
    name: 'Michał Bartczak',
    org: 'BLDG',
    talkTitle: 'Programy unijne wspierające rozwój agroturystyki',
    bullets: ['TODO: 3 hasła od prelegenta'],
  },
];

/* ------------------------------------------- blok D: przerwa 13:00 */

export const blokD: Slide[] = [
  {
    id: 'd1-przerwa',
    kind: 'przerwa',
    durationInFrames: sec(20),
    title: 'Przerwa i networking',
    backAt: '14:00',
    backAtISO: '2026-09-24T14:00:00+02:00',
    items: [
      'Powrót na scenę: 14:00, część II prelekcji i panel',
      'TODO: model cateringu, food trucki albo kuchnia Konfero',
      'Stoiska wystawców otwarte',
    ],
  },
  {
    id: 'd2-partnerzy',
    kind: 'partnerzy',
    durationInFrames: sec(12),
    title: 'Partnerzy targów',
    layout: 'grid',
    items: [{ name: 'TODO: partnerzy premium, pakiet z ekspozycją LED' }],
    note: 'Najdłuższa pętla dnia i najczęściej fotografowany ekran. Tu siedzi wartość pakietu premium.',
  },
  {
    id: 'd3-stoiska',
    kind: 'praktyczne',
    durationInFrames: sec(10),
    title: 'Umów rozmowę przy stoisku',
    items: ['Lista wystawców i numery stoisk pod kodem QR', 'Strefa VIP: piętro'],
    qr: 'TODO: URL do listy wystawców',
  },
];

/* ------------------------ blok E: prelekcje część II i panel, 14:00 */

export const blokE: Slide[] = [
  {
    id: 'e1-nastepny',
    kind: 'nastepny',
    durationInFrames: sec(6),
    label: 'Za chwilę na scenie',
    title: 'TODO: temat slotu 4',
  },
  {
    id: 'e2-slot4',
    kind: 'prelegent',
    durationInFrames: sec(12),
    manual: true,
    badge: 'prelekcja',
    time: '14:00',
    name: 'TODO: prelegent slotu 4',
    org: 'TODO: firma',
    talkTitle: 'Jak sprzedać swoją atrakcję hotelowi: pakiety, prowizje, umowy',
    bullets: ['TODO: 3 hasła'],
    note: 'Rekomendacja z analizy luk. Kogo zaprosić: dyrektor sprzedaży Uzdrowiska Ustroń, Hotel Olympic / CSR Zawodzie, COS OPO Szczyrk. Właściciel: Edwin.',
  },
  {
    id: 'e3-nastepny',
    kind: 'nastepny',
    durationInFrames: sec(6),
    label: 'Za chwilę na scenie',
    title: 'TODO: temat slotu 5',
  },
  {
    id: 'e4-slot5',
    kind: 'prelegent',
    durationInFrames: sec(12),
    manual: true,
    badge: 'prelekcja',
    time: '14:20',
    name: 'TODO: prelegent slotu 5',
    org: 'TODO: firma',
    talkTitle: 'Czego naprawdę szuka klient korporacyjny: wyjazdy firmowe i integracje w Beskidach',
    bullets: ['TODO: 3 hasła'],
    note: 'Głos strony popytu. Kogo zaprosić: agencja eventowa obsługująca korporacje, Centrum Kongresowe Belweder. Właściciel: Edwin.',
  },
  {
    id: 'e5-panel',
    kind: 'panel',
    durationInFrames: sec(14),
    manual: true,
    time: '14:45',
    title: 'Jak sprawić, żeby turysta został drugi dzień?',
    altTitle: 'Czy Śląsk Cieszyński potrafi sprzedawać się razem?',
    moderator: EVENT.mc,
    seats: [
      { name: 'TODO: przedstawiciel', org: 'Ustroń' },
      { name: 'TODO: przedstawiciel', org: 'Wisła' },
      { name: 'TODO: przedstawiciel', org: 'Skoczów' },
      { name: 'TODO: instytucja kultury', org: 'Zamek Cieszyn lub Muzeum Śląska Cieszyńskiego' },
      { name: 'TODO: przedsiębiorca', org: 'hotel lub duża atrakcja regionu' },
    ],
    note: 'Skład do domknięcia. Wariant altTitle, jeśli chcemy dyskusji, a nie prezentacji dorobku.',
  },
  {
    id: 'e6-showcase',
    kind: 'showcase',
    durationInFrames: sec(20),
    manual: true,
    title: 'AI podsumowuje panel na żywo',
    lead: 'Transkrypcja i wnioski z dyskusji, wygenerowane w trakcie panelu',
    items: [
      'Nagranie i transkrypcja w czasie rzeczywistym',
      'Podsumowanie na ekranie zaraz po zakończeniu panelu',
      'Pokaz możliwości: Rocksoft',
    ],
    note: 'Decyzja go / no-go: Piotr. Plan awaryjny przy no-go: wchodzi slajd f1-sekcja.',
  },
];

/* ------------------------- blok F: stoiska i zakończenie, 15:30 */

export const blokF: Slide[] = [
  { id: 'f1-sekcja', kind: 'sekcja', durationInFrames: sec(6), title: 'Rozmowy przy stoiskach', time: '15:30' },
  {
    id: 'f2-mapa',
    kind: 'praktyczne',
    durationInFrames: sec(12),
    title: 'Mapa stoisk',
    items: ['TODO: plan sali z numerami stoisk, od Astrid'],
  },
  {
    id: 'f3-wystawcy',
    kind: 'partnerzy',
    durationInFrames: sec(6),
    layout: 'single',
    title: 'Wystawcy',
    items: [{ name: 'TODO: wystawca', booth: 'nr stoiska', claim: 'jedno zdanie oferty' }],
    note: 'Layout single: jeden ekran na wystawcę, 6 s, pętla po całej liście.',
  },
  {
    id: 'f4-ankieta',
    kind: 'praktyczne',
    durationInFrames: sec(10),
    title: 'Powiedz nam, co poprawić',
    items: ['Ankieta zajmuje 2 minuty', 'Wyniki decydują o programie kolejnej edycji'],
    qr: 'TODO: URL ankiety',
  },
  {
    id: 'f5-zamkniecie',
    kind: 'zamkniecie',
    durationInFrames: sec(12),
    title: 'Dziękujemy',
    lines: [
      'Do zobaczenia na II Targach Atrakcji Śląska Cieszyńskiego',
      EVENT.hosts,
      EVENT.contact,
    ],
    qr: 'TODO: URL ankiety i newslettera',
  },
];

/* --------------------------------------------------- kompozycje */

export const KOMPOZYCJE = [
  { id: 'LoopRejestracja', time: '10:00–11:00', slides: blokA, loop: true },
  { id: 'BlokOtwarcie', time: '11:00–11:30', slides: blokB, loop: false },
  { id: 'BlokPrelekcjeI', time: '11:30–13:00', slides: blokC, loop: false },
  { id: 'LoopPrzerwa', time: '13:00–14:00', slides: blokD, loop: true },
  { id: 'BlokPrelekcjeII', time: '14:00–15:30', slides: blokE, loop: false },
  { id: 'LoopNetworking', time: '15:30–17:00', slides: blokF, loop: true },
] as const;

export const deck: Slide[] = [...blokA, ...blokB, ...blokC, ...blokD, ...blokE, ...blokF];

export const totalDuration = (slides: Slide[]) =>
  slides.reduce((sum, s) => sum + s.durationInFrames, 0);
