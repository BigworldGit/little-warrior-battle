# OpenAI Images Art Pipeline

This game should use the OpenAI Images API as an offline art-production tool, not as a realtime combat dependency. Image generation can take long enough that battle responsiveness would suffer, while pre-generated art keeps the online game fast and reliable.

## Current Integration

- `public/index.html` loads `public/assets/ai/manifest.json` at startup.
- If `textures.ground` is present, the Three.js arena replaces the procedural grass texture with that generated image.
- Sky and lighting colors can also be tuned from the manifest.
- If generated assets are missing, the game falls back to procedural textures and still runs.

Run the asset generator:

```bash
OPENAI_API_KEY=... npm run generate:ai-assets
```

Optional model override:

```bash
OPENAI_IMAGE_MODEL=gpt-image-2 OPENAI_API_KEY=... npm run generate:ai-assets
```

## Style Direction

Audience: children and parents.

Visual target: stylized-realistic, toy-like fantasy warriors, soft lighting, round shapes, cheerful colors, no gore, no scary realism. Combat feedback should feel like sparks, stars, bubbles, bounce, and magic impact.

## Prompt Seeds

### Arena Ground Texture

```text
Use case: stylized-concept
Asset type: seamless game texture for a Three.js ground plane
Primary request: a kid-friendly fantasy fighting arena floor texture, grass blended with soft stone tiles, playful flowers, polished mobile-game readability
Style: stylized-realistic, charming, high quality, bright morning light, soft PBR-like detail, no text, no characters, no weapons
Tileability: seamless square texture, edges must repeat cleanly
```

### Character Concept Sheet

```text
Use case: stylized-concept
Asset type: production concept sheet for a children's online fantasy fighting game
Primary request: a small brave warrior character with rounded toy-like proportions, expressive face, soft fabric armor, colorful safe fantasy weapon, front view, side view, back view
Style: stylized-realistic, polished 3D animation look, warm and friendly, no blood, no aggression, no text labels
```

### Weapon Icon Set

```text
Use case: stylized-concept
Asset type: mobile game weapon icon sheet
Primary request: nine friendly fantasy weapons matching the game weapons: courage gloves, starlight sword, candy hammer, vine bow, bubble trident, lightning badge, warm sun blade, snowflake sword, star wand
Style: rounded toy-like shapes, bright materials, clean readable silhouettes, consistent lighting, no text
```

## Next Asset Slots

The current code only consumes `textures.ground`. Good next slots:

- `textures.stonePath`
- `sprites.hitStars`
- `sprites.slashTrail`
- `characters.greenWarriorSheet`
- `characters.redWarriorSheet`
- `ui.weaponIconSheet`

Keep generated files under `public/assets/ai/generated/` and expose only stable paths through `manifest.json`.
