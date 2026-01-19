// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

const HEADERS = { Authorization: API_KEY };

// Step 1: Customer info
async function getCustomerInfo() {
  const res = await fetch(`${API_HOST}/api/2.0/portal/payment/customerinfo`, { headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Failed to get customer info: ${res.status} - ${t}`);
    return null;
  }
  const data = await res.json();
  const info = data?.response ?? {};
  console.log('Customer Info:', info);
  return info;
}

// Step 2: Customer balance
async function getCustomerBalance() {
  const res = await fetch(`${API_HOST}/api/2.0/portal/payment/customer/balance`, { headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Failed to get balance: ${res.status} - ${t}`);
    return null;
  }
  const data = await res.json();
  const balance = data?.response ?? {};
  console.log('Balance:');
  for (const sub of balance.subAccounts ?? []) {
    console.log(`- ${sub.currency}: ${sub.amount}`);
  }
  return balance;
}

// Step 3: Current quota
async function getCurrentQuota() {
  const res = await fetch(`${API_HOST}/api/2.0/portal/payment/quota`, { headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Failed to get current quota: ${res.status} - ${t}`);
    return null;
  }
  const data = await res.json();
  const q = data?.response ?? {};
  console.log(`Current Quota: ${q.title}, Trial: ${q.trial}, Due: ${q.dueDate}`);
  return q;
}

// Step 4: Available quotas
async function getAvailableQuotas() {
  const res = await fetch(`${API_HOST}/api/2.0/portal/payment/quotas`, { headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Failed to get available quotas: ${res.status} - ${t}`);
    return null;
  }
  const data = await res.json();
  const list = data?.response ?? [];
  console.log('Available Quotas:');
  for (const q of list) {
    const price = q.price ?? {};
    console.log(`- ${q.title} - ${price.value} ${price.isoCurrencySymbol}`);
  }
  return list;
}

// Step 5: Auto Top-Up settings
async function getTopupSettings() {
  const res = await fetch(`${API_HOST}/api/2.0/portal/payment/topupsettings`, { headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Failed to get topup settings: ${res.status} - ${t}`);
    return null;
  }
  const data = await res.json();
  const settings = data?.settings ?? data?.response ?? {};
  console.log('Auto Top-Up Settings:');
  console.log(`- Enabled: ${settings.enabled}`);
  console.log(`- Min Balance: ${settings.minBalance}`);
  console.log(`- Up To: ${settings.upToBalance}`);
  console.log(`- Currency: ${settings.currency}`);
  console.log(`- Last Modified: ${settings.lastModified}`);
  return settings;
}

// Step 6: Supported currencies
async function getSupportedCurrencies() {
  const res = await fetch(`${API_HOST}/api/2.0/portal/payment/currencies`, { headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Failed to get currencies: ${res.status} - ${t}`);
    return null;
  }
  const data = await res.json();
  const list = data?.response ?? [];
  console.log('Supported Currencies:');
  for (const c of list) {
    console.log(`- ${c.isoCurrencySymbol} - ${c.currencyNativeName}`);
  }
  return list;
}

// Run
(async () => {
  await getCustomerInfo();
  await getCustomerBalance();
  await getCurrentQuota();
  await getAvailableQuotas();
  await getTopupSettings();
  await getSupportedCurrencies();
})();
