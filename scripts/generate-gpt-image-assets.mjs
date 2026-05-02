import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Missing OPENAI_API_KEY. Set it before running npm run generate:ai-assets.');
  process.exit(1);
}

const outputDir = path.resolve('public/assets/ai/generated');
const manifestPath = path.resolve('public/assets/ai/manifest.json');
const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

const jobs = [
  {
    file: 'arena-ground.png',
    prompt: [
      'Use case: stylized-concept',
      'Asset type: seamless game texture for a Three.js ground plane',
      'Primary request: a kid-friendly fantasy fighting arena floor texture, grass blended with soft stone tiles, playful flowers, polished mobile-game readability',
      'Style: stylized-realistic, charming, high quality, bright morning light, soft PBR-like detail, no text, no characters, no weapons',
      'Tileability: seamless square texture, edges must repeat cleanly'
    ].join('\n')
  }
];

async function generateImage({ prompt, file }) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image generation failed for ${file}: ${response.status} ${text}`);
  }

  const json = await response.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No b64_json returned for ${file}.`);

  const target = path.join(outputDir, file);
  await writeFile(target, Buffer.from(b64, 'base64'));
  return `/assets/ai/generated/${file}`;
}

await mkdir(outputDir, { recursive: true });

const generated = {};
for (const job of jobs) {
  console.log(`Generating ${job.file} with ${imageModel}...`);
  generated[job.file] = await generateImage(job);
}

const manifest = {
  style: 'kid-friendly stylized-realistic fantasy arena',
  textures: {
    ground: generated['arena-ground.png']
  },
  sky: {
    top: '#5ea7e8',
    bottom: '#d7f4f2'
  },
  palette: {
    sun: '#fff4df',
    rim: '#9edcff'
  }
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifestPath}`);
