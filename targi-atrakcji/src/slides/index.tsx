import React from 'react';
import type { Slide } from '../../slides';
import { Agenda } from './Agenda';
import { Hero } from './Hero';
import { Nastepny } from './Nastepny';
import { Panel } from './Panel';
import { Partnerzy } from './Partnerzy';
import { Patroni } from './Patroni';
import { Praktyczne } from './Praktyczne';
import { Prelegent } from './Prelegent';
import { Przerwa } from './Przerwa';
import { Sekcja } from './Sekcja';
import { Showcase } from './Showcase';
import { Zamkniecie } from './Zamkniecie';

/**
 * Jedyne miejsce, ktore laczy dane z wygladem. Nowy typ slajdu w slides.ts
 * = nowy case tutaj; TypeScript nie przepusci brakujacego.
 */
export const SlideView: React.FC<{ slide: Slide }> = ({ slide }) => {
  switch (slide.kind) {
    case 'hero':
      return <Hero slide={slide} />;
    case 'sekcja':
      return <Sekcja slide={slide} />;
    case 'agenda':
      return <Agenda slide={slide} />;
    case 'prelegent':
      return <Prelegent slide={slide} />;
    case 'nastepny':
      return <Nastepny slide={slide} />;
    case 'panel':
      return <Panel slide={slide} />;
    case 'patroni':
      return <Patroni slide={slide} />;
    case 'partnerzy':
      return <Partnerzy slide={slide} />;
    case 'praktyczne':
      return <Praktyczne slide={slide} />;
    case 'przerwa':
      return <Przerwa slide={slide} />;
    case 'showcase':
      return <Showcase slide={slide} />;
    case 'zamkniecie':
      return <Zamkniecie slide={slide} />;
    default: {
      const never: never = slide;
      throw new Error(`Nieobslugiwany typ slajdu: ${JSON.stringify(never)}`);
    }
  }
};
