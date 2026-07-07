/**
 * Single source of truth for the currencies a book price can be denominated in.
 * Values are ISO 4217 three-letter codes, shared by the Zod validators and the
 * OpenAPI docs. To support another currency, add its code here.
 */
export const DEFAULT_CURRENCY = 'USD';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'SGD',
  'INR',
  'VND',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const SUPPORTED_CURRENCIES_MESSAGE = SUPPORTED_CURRENCIES.join(', ');
