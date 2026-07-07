const { buildIconSvg } = require('../scripts/generate-brand-icons');

describe('buildIconSvg', () => {
  it('draws the oxblood background by default', () => {
    const svg = buildIconSvg({ size: 100 });

    expect(svg).toContain('fill="#7F3523"');
    expect(svg).toContain('width="100" height="100"');
  });

  it('omits the background rect when includeBackground is false', () => {
    const svg = buildIconSvg({ size: 100, includeBackground: false });

    expect(svg).not.toContain('fill="#7F3523"');
  });

  it('always draws the message-circle and heart paths in white', () => {
    const svg = buildIconSvg({ size: 100 });

    expect(svg).toContain('M7.9 20A9 9 0 1 0 4 16.1L2 22Z');
    expect(svg).toContain('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3');
    expect(svg).toContain('stroke="#FFFFFF"');
    expect(svg).toContain('fill="#FFFFFF"');
  });

  it('insets the glyph group when insetRatio is provided', () => {
    const full = buildIconSvg({ size: 100 });
    const inset = buildIconSvg({ size: 100, insetRatio: 0.6 });

    expect(inset).not.toEqual(full);
  });
});
