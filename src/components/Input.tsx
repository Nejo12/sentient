import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';

type InputProps = TextInputProps & {
  style?: StyleProp<TextStyle>;
};

export function Input({ style, multiline, onFocus, onBlur, ...textInputProps }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      multiline={multiline}
      placeholderTextColor="rgba(43, 37, 33, 0.2)"
      textAlignVertical={multiline ? 'top' : 'center'}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      style={[
        styles.input,
        multiline && styles.multiline,
        focused && styles.focused,
        style,
      ]}
      {...textInputProps}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    color: colors.ink,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
  },
  multiline: {
    paddingTop: spacing[4],
  },
  focused: {
    borderColor: 'rgba(127, 53, 35, 0.55)',
    backgroundColor: colors.paperStrong,
    shadowColor: colors.oxblood,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
});
