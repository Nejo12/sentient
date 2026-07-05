import { useSessionStore } from '../src/store/sessionStore';

describe('sessionStore', () => {
  beforeEach(() => useSessionStore.getState().reset());

  it('shows understanding grid only after do intent', () => {
    useSessionStore.getState().setIntent('missing');
    expect(useSessionStore.getState().showUnderstandingGrid).toBe(false);
    useSessionStore.getState().setIntent('do');
    expect(useSessionStore.getState().showUnderstandingGrid).toBe(true);
  });

  it('stores results and optional perspective', () => {
    const results = [
      {
        label: 'Option 1',
        tag: 'direct',
        text: 'Thanks for letting me know.',
        recommended: true,
      },
    ];

    useSessionStore.getState().setResults(results, 'They may feel overlooked');

    expect(useSessionStore.getState().results).toEqual(results);
    expect(useSessionStore.getState().perspective).toBe('They may feel overlooked');
  });
});
