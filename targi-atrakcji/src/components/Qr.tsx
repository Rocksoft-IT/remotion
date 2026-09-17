import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { C, TONE, ToneName, base } from '../theme';
import { isTodo, todoLabel } from '../assets';

/**
 * Kod QR generowany synchronicznie z danych, bez sieci i bez plikow.
 * Zmiana URL w slides.ts = nowy kod przy najblizszym renderze.
 */
export const Qr: React.FC<{
  value: string;
  size?: number;
  caption?: string;
  tone?: ToneName;
}> = ({ value, size = 260, caption, tone = 'dark' }) => {
  const t = TONE[tone];

  const modules = useMemo(() => {
    if (isTodo(value)) return null;
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const cells: { x: number; y: number }[] = [];
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) cells.push({ x: col, y: row });
      }
    }
    return { count, cells };
  }, [value]);

  const box = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size * 0.06,
        boxSizing: 'border-box',
      }}
    >
      {modules ? (
        <svg viewBox={`0 0 ${modules.count} ${modules.count}`} width="100%" height="100%" shapeRendering="crispEdges">
          {modules.cells.map((cell) => (
            <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width={1} height={1} fill={C.granat} />
          ))}
        </svg>
      ) : (
        <div
          style={{
            ...base,
            width: '100%',
            height: '100%',
            border: `4px dashed ${C.slonce}`,
            borderRadius: 12,
            color: C.slonce,
            fontSize: size * 0.1,
            fontWeight: 700,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
        >
          QR
          <br />
          brak URL
        </div>
      )}
    </div>
  );

  const label = caption ?? (isTodo(value) ? todoLabel(value) : 'Zeskanuj telefonem');

  return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      {box}
      <div style={{ fontSize: 30, fontWeight: 600, color: t.dim, maxWidth: size * 1.6, textAlign: 'center', lineHeight: 1.25 }}>
        {label}
      </div>
    </div>
  );
};
