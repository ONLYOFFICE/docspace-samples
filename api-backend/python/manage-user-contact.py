import requests
 
# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'
    
# Headers with API key for authentication
HEADERS = {
    'Accept': 'application/json',
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}
 
# Step 1: Create or update user contacts
def set_user_contacts(userid, contacts):
    url = f'{BASE_URL}/api/2.0/people/{userid}/contacts'
    data = {'contacts': contacts}
    response = requests.put(url, json=data, headers=HEADERS)
    if response.status_code == 200:
        print(f'Contacts updated successfully for user {userid}')
    else:
        print(f'Failed to update contacts: {response.status_code} - {response.text}')

# Step 2: Print user contacts
def print_user_contacts(userid):
    url = f'{BASE_URL}/api/2.0/people/{userid}'
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        user_data = response.json()
        try:
            print(user_data['response']['contacts'])
        except:
            print(f'No contact found for user {userid}')
    else:
        print(f'Failed to retrieve user contacts: {response.status_code} - {response.text}')

if __name__ == '__main__':
    userid = '00000000-0000-0000-0000-000000000000'

    # Step 1: Create or update user contacts
    contacts = [{'type': 'GTalk', 'value': 'my@gmail.com'}]
    set_user_contacts(userid, contacts)
        
    # Step 2: Print user contacts
    print_user_contacts(userid)