/** Never interpret missing or placeholder configuration as permission to go live. */
export function configured(name: string): boolean {
  const value = process.env[name]?.trim();
  return Boolean(value && !/^(\[SENSITIVE\]|change[-_ ]?me|your[-_ ]|placeholder)/i.test(value));
}
export function paymentMode(): 'sandbox' | 'test' | 'live' | 'disabled' {
  const mode = process.env.PAYMENTS_MODE;
  return mode === 'sandbox' || mode === 'test' || mode === 'live' ? mode : 'disabled';
}
export function integrationStatus() {
  return {
    payments: paymentMode(),
    flitt: configured('FLITT_MERCHANT_ID') && configured('FLITT_SECRET_KEY'),
    bog: configured('BOG_CLIENT_ID') && configured('BOG_CLIENT_SECRET'),
    shipping: process.env.SHIPPING_MODE === 'live' ? 'live' : 'manual',
    quickshipper: configured('QUICKSHIPPER_API_KEY') || (configured('QUICKSHIPPER_CLIENT_ID') && configured('QUICKSHIPPER_CLIENT_SECRET')),
    pickup: ['QUICKSHIPPER_SENDER_PHONE', 'QUICKSHIPPER_SENDER_ADDRESS', 'QUICKSHIPPER_SENDER_LAT', 'QUICKSHIPPER_SENDER_LNG'].every(configured),
    email: process.env.EMAIL_MODE === 'live' && configured('SMTP_HOST') && configured('SMTP_FROM'),
    maps: configured('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
    contact: configured('NEXT_PUBLIC_CONTACT_EMAIL'),
    instagram: configured('NEXT_PUBLIC_INSTAGRAM_URL'),
  };
}

export function flittTestMerchant(): boolean {
  return process.env.FLITT_MERCHANT_ID === '1549901' && process.env.FLITT_SECRET_KEY === 'test';
}
