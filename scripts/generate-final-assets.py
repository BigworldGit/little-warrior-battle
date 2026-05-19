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

# Generate Ultra High Quality Tree with perfectly isolated edges
generate_image("A hyper-realistic AAA game asset of a massive ancient fantasy oak tree, dense green foliage, volumetric lighting, isolated on a pure #000000 black background, no ground, no sky, perfect anti-aliased edges", "tree_v3.png")
# Generate a detailed face for the characters
generate_image("A high quality hand-painted stylized warrior face with a heroic expression, 512x512 texture, perfectly isolated on black background", "hero_face.png")
# Generate a metal armor texture
generate_image("A high quality seamless texture of engraved fantasy plate armor, steel with gold filigree, AAA game texture", "armor_tex.png")

