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


def api_get(path):
    response = requests.get(f'{API_HOST}{path}', headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.json().get('response', {})


def get_customer_info():
    info = api_get('/api/2.0/portal/payment/customerinfo')
    print("Customer Info:", info)


def get_customer_balance():
    balance = api_get('/api/2.0/portal/payment/customer/balance')
    print("Balance:")
    for sub in balance.get('subAccounts', []):
        print(f"- {sub.get('currency')}: {sub.get('amount')}")


def get_current_quota():
    quota = api_get('/api/2.0/portal/payment/quota')
    print(f"Current Quota: {quota.get('title')}, Trial: {quota.get('trial')}, Due: {quota.get('dueDate')}")


def get_available_quotas():
    quotas = api_get('/api/2.0/portal/payment/quotas')
    print("Available Quotas:")
    for q in (quotas if isinstance(quotas, list) else []):
        price = q.get('price', {})
        print(f"- {q.get('title')} - {price.get('value')} {price.get('isoCurrencySymbol')}")


def get_topup_settings():
    data = requests.get(
        f'{API_HOST}/api/2.0/portal/payment/topupsettings',
        headers=HEADERS,
        timeout=30,
    )
    data.raise_for_status()
    settings = data.json().get('settings', {})
    print("Auto Top-Up Settings:")
    print(f"- Enabled: {settings.get('enabled')}")
    print(f"- Min Balance: {settings.get('minBalance')}")
    print(f"- Up To: {settings.get('upToBalance')}")
    print(f"- Currency: {settings.get('currency')}")
    print(f"- Last Modified: {settings.get('lastModified')}")


def get_supported_currencies():
    currencies = api_get('/api/2.0/portal/payment/currencies')
    print("Supported Currencies:")
    for c in (currencies if isinstance(currencies, list) else []):
        print(f"- {c.get('isoCurrencySymbol')} - {c.get('currencyNativeName')}")


if __name__ == '__main__':
    try:
        get_customer_info()
        get_customer_balance()
        get_current_quota()
        get_available_quotas()
        get_topup_settings()
        get_supported_currencies()
    except requests.HTTPError as err:
        print(f"API error: {err.response.status_code} {err.response.text}")
    except requests.RequestException as err:
        print(f"Request failed: {err}")
