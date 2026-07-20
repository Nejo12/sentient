import { act, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import { DisclosureSection } from '../src/components/adaptive/DisclosureSection';
import { ProgressLoader } from '../src/components/adaptive/ProgressLoader';

describe('calm interaction components', () => {
  it('keeps disclosure content hidden until requested and exposes expansion state', () => {
    function Harness() {
      const [expanded, setExpanded] = useState(false);

      return (
        <DisclosureSection
          closedLabel="Understand more"
          expanded={expanded}
          onToggle={() => setExpanded((current) => !current)}
          openLabel="Hide understanding"
        >
          <Text>Deeper context</Text>
        </DisclosureSection>
      );
    }

    const { getByRole, getByText, queryByText } = render(<Harness />);

    expect(queryByText('Deeper context')).toBeNull();
    expect(getByRole('button').props.accessibilityState).toEqual({ expanded: false });

    fireEvent.press(getByText('Understand more'));

    expect(getByText('Deeper context')).toBeTruthy();
    expect(getByRole('button').props.accessibilityState).toEqual({ expanded: true });
  });

  it('advances through meaningful loading stages without presenting fake percentages', () => {
    jest.useFakeTimers();
    const { getByText, queryByText } = render(<ProgressLoader />);

    expect(getByText('Reading tone')).toBeTruthy();
    expect(getByText('Considering ambiguity')).toBeTruthy();
    expect(getByText('Preparing the clearest reply')).toBeTruthy();
    expect(queryByText(/%/)).toBeNull();

    act(() => {
      jest.advanceTimersByTime(900);
    });

    expect(getByText('Considering ambiguity')).toBeTruthy();
    jest.useRealTimers();
  });
});