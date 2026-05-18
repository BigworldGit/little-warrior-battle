import urllib.request
import urllib.parse
import json
import base64
import os
from google.oauth2 import service_account
from google.auth.transport.requests import Request

cred_path = '/Users/roy/Downloads/gen-lang-client-0723741569-9c2a2dedfeed.json'
project_id = 'gen-lang-client-0723741569'
region = 'us-central1'

creds = service_account.Credentials.from_service_account_file(cred_path, scopes=['https://www.googleapis.com/auth/cloud-platform'])
creds.refresh(Request())
token = creds.token

def generate_image(prompt, filename):
    url = f"https://{region}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{region}/publishers/google/models/imagen-3.0-generate-001:predict"
    data = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "1:1"
        }
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'))
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    
    print(f"Generating image for: {prompt}")
    try:
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode('utf-8'))
        base64_img = result['predictions'][0]['bytesBase64Encoded']
        
        filepath = os.path.join('../public/assets', filename)
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(base64_img))
        print(f"Saved {filepath}")
    except Exception as e:
        print(f"Failed: {e}")

if not os.path.exists('../public/assets'):
    os.makedirs('../public/assets')

generate_image("A highly detailed AAA 3D render of a lush fantasy oak tree, vibrant green leaves, brown trunk, perfectly centered, completely isolated on a pure #000000 black background", "tree.png")
generate_image("A stylized glowing red health potion bottle, glowing liquid, magical sparkles, completely isolated on a pure #000000 black background, 3D render", "potion.png")
generate_image("A flaming meteor rock falling diagonally, burning fire trail, glowing embers, completely isolated on a pure #000000 black background, 3D render", "meteor.png")
generate_image("A stylized fluffy white cloud, soft lighting, completely isolated on a pure #000000 black background, 3D render", "cloud.png")

