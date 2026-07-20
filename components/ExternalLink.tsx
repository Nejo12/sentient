import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

export function ExternalLink(props: ComponentProps<typeof Link>) {
  return (
    <Link
      target="_blank"
      {...props}
      onPress={(event) => {
        props.onPress?.(event);

        if (event.defaultPrevented || Platform.OS === 'web') {
          return;
        }

        event.preventDefault();
        void WebBrowser.openBrowserAsync(String(props.href));
      }}
    />
  );
}
