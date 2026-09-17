import React from 'react';
import { Composition, Folder } from 'remotion';
import { FPS, KOMPOZYCJE, deck, totalDuration, type Slide } from '../slides';
import { Deck } from './Deck';
import { HEIGHT, WIDTH } from './theme';

/**
 * Kompozycje generowane wprost z danych. Dopisanie slajdu do blokA..blokF
 * albo bloku do KOMPOZYCJE zmienia timeline bez dotykania tego pliku.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Bloki-dnia">
        {KOMPOZYCJE.map((k) => (
          <Composition
            key={k.id}
            id={k.id}
            component={Deck}
            durationInFrames={Math.max(1, totalDuration(k.slides as Slide[]))}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{ slides: k.slides as Slide[] }}
          />
        ))}
      </Folder>

      <Folder name="Caly-dzien">
        <Composition
          id="PelnyDeck"
          component={Deck}
          durationInFrames={Math.max(1, totalDuration(deck))}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ slides: deck }}
        />
      </Folder>

      {/* Kazdy slajd osobno: do renderu stopklatek i do slajdow recznych (manual). */}
      <Folder name="Slajdy-pojedyncze">
        {deck.map((slide) => (
          <Composition
            key={slide.id}
            id={`Slajd-${slide.id.replace(/[^a-zA-Z0-9-]/g, '-')}`}
            component={Deck}
            durationInFrames={slide.durationInFrames}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{ slides: [slide] }}
          />
        ))}
      </Folder>
    </>
  );
};
