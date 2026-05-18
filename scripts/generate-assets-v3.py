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

# Generate a better tree with soft edges
generate_image("A highly detailed AAA 3D stylized render of a massive magical fantasy tree, lush dense green leaves, soft lighting, brown trunk, perfectly centered, isolated on a pure #000000 black background", "tree_v2.png")
# Generate a medical crate
generate_image("A high quality stylized 3D medical crate, white cube with a glowing green cross icon on all sides, fantasy game asset, isolated on a pure #000000 black background", "med_kit.png")
# Generate a wind noise texture for grass
generate_image("A high quality seamless black and white noise texture, clouds and wisps, for wind simulation, game texture", "wind_noise.png")

