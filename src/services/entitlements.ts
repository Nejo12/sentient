import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';

import { strings } from '../constants/strings';

export const FREE_DAILY_LIMIT = 5;
export const REWRITE_COUNT_STORAGE_KEY = 'sentient:daily-rewrites';
// Must match the entitlement Identifier in the RevenueCat dashboard exactly
// (Product catalog > Entitlements) — that field is immutable after creation,
// so the app matches it here rather than the other way around.
const PRO_ENTITLEMENT_ID = 'Sentient Pro';

type DailyRewriteRecord = {
  date: string;
  count: number;
};

let configured = false;
let proStatus = false;

function getRevenueCatApiKey(): string | undefined {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim();
  return apiKey || undefined;
}

function getLocalDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hasActiveProEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]);
}

async function ensureConfigured(): Promise<void> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey || configured) {
    return;
  }

  Purchases.configure({ apiKey });
  configured = true;
  await refreshProStatus();
}

async function loadDailyRewriteRecord(): Promise<DailyRewriteRecord> {
  const today = getLocalDateKey();

  try {
    const stored = await AsyncStorage.getItem(REWRITE_COUNT_STORAGE_KEY);
    if (!stored) {
      return { date: today, count: 0 };
    }

    const parsed = JSON.parse(stored) as Partial<DailyRewriteRecord>;
    if (parsed.date !== today || typeof parsed.count !== 'number' || parsed.count < 0) {
      return { date: today, count: 0 };
    }

    return { date: today, count: parsed.count };
  } catch {
    return { date: today, count: 0 };
  }
}

async function saveDailyRewriteRecord(record: DailyRewriteRecord): Promise<void> {
  await AsyncStorage.setItem(REWRITE_COUNT_STORAGE_KEY, JSON.stringify(record));
}

export async function refreshProStatus(): Promise<void> {
  if (!getRevenueCatApiKey()) {
    proStatus = false;
    return;
  }

  await ensureConfigured();

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    proStatus = hasActiveProEntitlement(customerInfo);
  } catch {
    proStatus = false;
  }
}

export function isPro(): boolean {
  if (!getRevenueCatApiKey()) {
    return false;
  }

  return proStatus;
}

export async function getDailyRewriteCount(): Promise<number> {
  const record = await loadDailyRewriteRecord();
  return record.count;
}

export async function canRewrite(): Promise<boolean> {
  if (isPro()) {
    return true;
  }

  const record = await loadDailyRewriteRecord();
  return record.count < FREE_DAILY_LIMIT;
}

export async function incrementRewriteCount(): Promise<void> {
  if (isPro()) {
    return;
  }

  const record = await loadDailyRewriteRecord();
  await saveDailyRewriteRecord({
    date: record.date,
    count: record.count + 1,
  });
}

export async function presentPaywall(): Promise<void> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    Alert.alert(strings.settings.proTitle, strings.settings.proBody);
    return;
  }

  await ensureConfigured();

  try {
    const offerings = await Purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];
    if (!packageToBuy) {
      Alert.alert(strings.settings.proTitle, strings.settings.proBody);
      return;
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    proStatus = hasActiveProEntitlement(customerInfo);
  } catch {
    Alert.alert(strings.settings.proTitle, strings.settings.proBody);
  }
}

export function resetEntitlementsForTests(): void {
  configured = false;
  proStatus = false;
}
