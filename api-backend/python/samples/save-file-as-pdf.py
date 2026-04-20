'''
Example: Save a file as PDF

This example demonstrates how to save an existing file as a PDF document in ONLYOFFICE DocSpace.
The converted PDF file is created in the target folder specified in the request body.

Using methods:
- POST /api/2.0/files/file/{id}/saveaspdf (https://api.onlyoffice.com/docspace/api-backend/usage-api/save-file-as-pdf/)
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


# Step 1: Save an existing file as PDF
def save_file_as_pdf(file_id, folder_id, title):
    url = f'{API_HOST}/api/2.0/files/file/{file_id}/saveaspdf'
    body = {
        'folderId': folder_id,
        'title': title,
    }

    response = requests.post(url, json=body, headers=HEADERS, timeout=30)

    if response.status_code == 200:
        return response.json().get('response')

    print(f"Save as PDF failed. Status code: {response.status_code}, Message: {response.text}")
    return None


if __name__ == "__main__":
    try:
        file_id = 123456  # Replace with the source file ID
        folder_id = 12345  # Replace with the target folder ID
        pdf_title = 'Converted-document.pdf'

        result = save_file_as_pdf(file_id, folder_id, pdf_title)

        if result:
            print('PDF file created successfully.')
            print(f"New file ID: {result.get('id')}")
            print(f"New file title: {result.get('title')}")
            print(f"Folder ID: {result.get('folderId')}")
    except Exception as err:
        print(err)
