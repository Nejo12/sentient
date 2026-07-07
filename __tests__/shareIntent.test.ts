import { parseNativeShareIntent, parseShareIntent } from '../src/services/shareIntent';

describe('share intent parser', () => {
  it('parses message and source app from a sentient deep link', () => {
    const parsed = parseShareIntent({
      url: 'sentient://choose?message=So%20you%20cancelled&sourceApp=WhatsApp',
    });

    expect(parsed).toEqual({
      message: 'So you cancelled',
      sourceApp: 'WhatsApp',
    });
  });

  it('supports route params with fallback key names', () => {
    const parsed = parseShareIntent({
      params: {
        text: ['Need to talk'],
        app: 'Messenger',
      },
    });

    expect(parsed).toEqual({
      message: 'Need to talk',
      sourceApp: 'Messenger',
    });
  });

  it('returns null when no shared message exists', () => {
    const parsed = parseShareIntent({
      url: 'sentient://choose?sourceApp=WhatsApp',
      params: {
        app: 'WhatsApp',
      },
    });

    expect(parsed).toBeNull();
  });

  it('parses native share intent text and source title', () => {
    const parsed = parseNativeShareIntent({
      text: 'Can we talk tonight?',
      meta: { title: 'Messages' },
    });

    expect(parsed).toEqual({
      message: 'Can we talk tonight?',
      sourceApp: 'Messages',
    });
  });
});
