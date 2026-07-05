import { UNDERSTANDING_OPTIONS, requiresUnderstanding } from '../src/constants/understanding';

describe('understanding', () => {
  it('lists 6 options', () => {
    expect(UNDERSTANDING_OPTIONS).toHaveLength(6);
  });

  it('requires understanding only for do intent', () => {
    expect(requiresUnderstanding('do')).toBe(true);
    expect(requiresUnderstanding('missing')).toBe(false);
  });
});
