import AsyncStorage from '@react-native-async-storage/async-storage';

export const SETUP_COMPLETE_KEY = 'setup_complete';
export const SETUP_SHARE_DONE_KEY = 'setup_share_done';

export async function isSetupComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SETUP_COMPLETE_KEY);
  return value === 'true';
}

export async function setSetupComplete(): Promise<void> {
  await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
}

export async function isShareSetupDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SETUP_SHARE_DONE_KEY);
  return value === 'true';
}

export async function setShareSetupDone(): Promise<void> {
  await AsyncStorage.setItem(SETUP_SHARE_DONE_KEY, 'true');
}
