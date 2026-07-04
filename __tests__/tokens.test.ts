import { colors, spacing, radii } from '../src/theme/tokens';

describe('tokens', () => {
  it('uses oxblood as primary', () => {
    expect(colors.oxblood).toBe('#7F3523');
  });
  it('spacing follows 8pt grid', () => {
    expect(spacing[4]).toBe(16);
  });
  it('pill radius is 9999', () => {
    expect(radii.pill).toBe(9999);
  });
});
