import type { Action, StageState } from './bus';

export type LanInfo = {
  enabled: boolean;
  key: string | null;
  port: number;
  urls: { iface: string; base: string; key: string }[];
  firewallNotice: string | null;
};

/** Bridge exposed by electron/preload.js. State lives in the main process (electron/main.ts);
 *  pulpit/scena only render what arrives here and send actions back. */
declare global {
  interface Window {
    deck: {
      onState: (cb: (payload: { state: StageState; lan: LanInfo }) => void) => void;
      requestState: () => void;
      sendAction: (action: Action) => void;
      quit: () => void;
    };
  }
}

export {};
