import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii } from '../theme/tokens';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 22;
const KNOB_PADDING = 3;

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: ToggleProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.knob,
          { transform: [{ translateX: value ? TRACK_WIDTH - KNOB_SIZE - KNOB_PADDING : KNOB_PADDING }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.oxblood,
    borderWidth: 1,
    borderColor: colors.oxblood,
  },
  trackOff: {
    backgroundColor: colors.paperMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  knob: {
    position: 'absolute',
    top: KNOB_PADDING,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.paperStrong,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.6,
  },
});
