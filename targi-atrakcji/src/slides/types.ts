import type { Slide } from '../../slides';

export type OfKind<K extends Slide['kind']> = Extract<Slide, { kind: K }>;
export type SlideProps<K extends Slide['kind']> = { slide: OfKind<K> };
