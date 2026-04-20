'''
Example: Manage webhooks and retry failed delivery

This example demonstrates how to create, list, update, retry, and delete tenant webhooks in ONLYOFFICE DocSpace.
If there is no failed delivery log for the created webhook, the retry step is skipped.

Using methods:
- POST /api/2.0/settings/webhook (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-webhook/)
- GET /api/2.0/settings/webhook (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-tenant-webhooks/)
- PUT /api/2.0/settings/webhook (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-webhook/)
- GET /api/2.0/settings/webhooks/log (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-webhooks-logs/)
- PUT /api/2.0/settings/webhook/{id}/retry (https://api.onlyoffice.com/docspace/api-backend/usage-api/retry-webhook/)
- DELETE /api/2.0/settings/webhook/{id} (https://api.onlyoffice.com/docspace/api-backend/usage-api/remove-webhook/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}


def unwrap_response(data):
    if isinstance(data, dict) and 'response' in data:
        return data['response']
    return data


def create_webhook(name, uri):
    url = f'{API_HOST}/api/2.0/settings/webhook'
    body = {
        'name': name,
        'uri': uri,
        'secretKey': 'webhook-secret-demo',
        'enabled': True,
        'ssl': True,
        'triggers': 'FileUploaded',
    }

    response = requests.post(url, json=body, headers=HEADERS, timeout=30)
    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"Webhook creation failed. Status code: {response.status_code}, Message: {response.text}")
    return None


def list_webhooks():
    url = f'{API_HOST}/api/2.0/settings/webhook'
    response = requests.get(url, headers=HEADERS, timeout=30)

    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"Webhook list request failed. Status code: {response.status_code}, Message: {response.text}")
    return None


def update_webhook(webhook_id, name, uri):
    url = f'{API_HOST}/api/2.0/settings/webhook'
    body = {
        'id': webhook_id,
        'name': name,
        'uri': uri,
        'secretKey': 'webhook-secret-demo-updated',
        'enabled': True,
        'ssl': True,
        'triggers': 'RoomCreated',
    }

    response = requests.put(url, json=body, headers=HEADERS, timeout=30)
    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"Webhook update failed. Status code: {response.status_code}, Message: {response.text}")
    return None


def get_webhook_logs(config_id):
    url = f'{API_HOST}/api/2.0/settings/webhooks/log'
    params = {
        'configId': config_id,
        'count': 10,
        'startIndex': 0,
    }
    response = requests.get(url, params=params, headers=HEADERS, timeout=30)

    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"Webhook logs request failed. Status code: {response.status_code}, Message: {response.text}")
    return None


def pick_failed_log(logs):
    if not isinstance(logs, list):
        return None

    for item in logs:
        status = item.get('status')
        if isinstance(status, int) and status >= 400:
            return item

    return None


def retry_webhook(log_id):
    url = f'{API_HOST}/api/2.0/settings/webhook/{log_id}/retry'
    response = requests.put(url, headers=HEADERS, timeout=30)

    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"Webhook retry failed. Status code: {response.status_code}, Message: {response.text}")
    return None


def delete_webhook(webhook_id):
    url = f'{API_HOST}/api/2.0/settings/webhook/{webhook_id}'
    response = requests.delete(url, headers=HEADERS, timeout=30)

    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"Webhook deletion failed. Status code: {response.status_code}, Message: {response.text}")
    return None


if __name__ == "__main__":
    webhook_id = None

    try:
        created = create_webhook('Docs API sample webhook', 'https://example.com/webhooks/docspace')
        webhook_id = created.get('id') if isinstance(created, dict) else None
        print('Created webhook:', created)

        listed = list_webhooks()
        print('Webhook list:', listed)

        if not webhook_id:
            print('Webhook ID was not returned. Stopping the sample.')
        else:
            updated = update_webhook(
                webhook_id,
                'Docs API sample webhook updated',
                'https://example.com/webhooks/docspace-updated',
            )
            print('Updated webhook:', updated)

            logs = get_webhook_logs(webhook_id)
            print('Webhook logs:', logs)

            failed_log = pick_failed_log(logs)
            if failed_log:
                retried = retry_webhook(failed_log['id'])
                print('Retried failed webhook delivery:', retried)
            else:
                print('No failed webhook delivery log found for retry.')
    except Exception as err:
        print(err)
    finally:
        if webhook_id:
            deleted = delete_webhook(webhook_id)
            print('Deleted webhook:', deleted)
