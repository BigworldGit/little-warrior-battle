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

# Generate hyper-detailed face
generate_image("A hyper-realistic AAA 3D game character portrait of a handsome heroic knight, detailed skin texture, intense blue eyes, slight beard stubble, looking straight, perfectly centered, isolated on pure black background, 8k resolution", "hero_face_v3.png")
# Generate dense tree with solid canopy to avoid hollow holes
generate_image("A highly detailed dense magical oak tree, thick foliage with no gaps, vibrant green, brown bark, massive trunk, 3D stylized render, perfectly centered, isolated on pure black background, masterpiece quality", "tree_v5.png")

