'''
Example: Retrieve billing and payment information

This example demonstrates how to read billing-related information in ONLYOFFICE DocSpace via the API:
customer profile, balance by currency, current quota, available quotas, auto top-up settings, and supported currencies.

Using methods:
- GET /api/2.0/portal/payment/customerinfo (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-customer-info/)
- GET /api/2.0/portal/payment/customer/balance (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-customer-balance/)
- GET /api/2.0/portal/payment/quota (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-quota-payment-information/)
- GET /api/2.0/portal/payment/quotas (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-payment-quotas/)
- GET /api/2.0/portal/payment/topupsettings (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-tenant-wallet-settings/)
- GET /api/2.0/portal/payment/currencies (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-payment-currencies/)
'''

import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

HEADERS = {'Authorization': API_KEY}

def get_customer_info():
  r = requests.get(f'{API_HOST}/api/2.0/portal/payment/customerinfo', headers=HEADERS)
  print("Customer Info:", r.json().get('response', {}))

def get_customer_balance():
  r = requests.get(f'{API_HOST}/api/2.0/portal/payment/customer/balance', headers=HEADERS)
  balance = r.json().get('response', {})
  print("Balance:")
  for sub in balance.get('subAccounts', []):
    print(f"- {sub.get('currency')}: {sub.get('amount')}")

def get_current_quota():
  r = requests.get(f'{API_HOST}/api/2.0/portal/payment/quota', headers=HEADERS)
  quota = r.json().get('response', {})
  print(f"Current Quota: {quota.get('title')}, Trial: {quota.get('trial')}, Due: {quota.get('dueDate')}")

def get_available_quotas():
  r = requests.get(f'{API_HOST}/api/2.0/portal/payment/quotas', headers=HEADERS)
  print("Available Quotas:")
  for q in r.json().get('response', []):
    price = q.get('price', {})
    print(f"- {q.get('title')} - {price.get('value')} {price.get('isoCurrencySymbol')}")

def get_topup_settings():
  r = requests.get(f'{API_HOST}/api/2.0/portal/payment/topupsettings', headers=HEADERS)
  settings = r.json().get('settings', {})
  print("Auto Top-Up Settings:")
  print(f"- Enabled: {settings.get('enabled')}")
  print(f"- Min Balance: {settings.get('minBalance')}")
  print(f"- Up To: {settings.get('upToBalance')}")
  print(f"- Currency: {settings.get('currency')}")
  print(f"- Last Modified: {settings.get('lastModified')}")

def get_supported_currencies():
  r = requests.get(f'{API_HOST}/api/2.0/portal/payment/currencies', headers=HEADERS)
  print("Supported Currencies:")
  for c in r.json().get('response', []):
    print(f"- {c.get('isoCurrencySymbol')} - {c.get('currencyNativeName')}")

if __name__ == '__main__':
  get_customer_info()
  get_customer_balance()
  get_current_quota()
  get_available_quotas()
  get_topup_settings()
  get_supported_currencies()
