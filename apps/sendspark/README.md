# AI-VFX Studio

AI-powered video effects generator that transforms images into cinematic videos with professional visual effects.

## Features

- **80+ Cinematic Effects**: Camera moves, VFX, and AI-powered transformations
- **Drag & Drop Upload**: Support for images up to 10MB
- **Real-time Generation**: Live progress tracking with polling
- **Multiple Formats**: Support for various aspect ratios and resolutions
- **Professional Quality**: High-quality video output with customizable settings

## Effects Categories

### 🎬 Cinematic Camera Moves
- Dolly Zoom (Hitchcock effect)
- Crane movements
- Pan and tilt operations
- Orbit and tracking shots
- Zoom effects

### ✨ Visual Effects (VFX)
- Explosions and particle effects
- Fire and energy simulations
- Glass shattering
- Metal debris
- Atmospheric effects

### 🤖 AI Effects
- Character transformations (Venom, Hulk, etc.)
- Superhero effects
- Reality-warping visuals
- Enhanced compositions

## Getting Started

### Prerequisites
- Node.js 18+
- MuAPI account and API key

### Installation

1. Navigate to the AI-VFX app directory:
   ```bash
   cd apps/ai-vfx
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development server:
   ```bash
   pnpm run dev
   ```

4. Open [http://localhost:5174](http://localhost:5174) in your browser

### Build for Production

```bash
pnpm run build
```

The built files will be available in `../../public/apps/ai-vfx/`

## Usage

### 1. Configure API Key
- Click on any action that requires API access
- Enter your MuAPI key in the modal
- Key is stored securely in localStorage

### 2. Upload Image
- Drag and drop an image file, or
- Click "Choose File" to browse, or
- Enter a direct image URL

### 3. Select Effect
- Browse through effect categories
- Click on any effect to select it
- Preview shows selected effect details

### 4. Configure Settings
- **Aspect Ratio**: 16:9, 9:16, 1:1, 4:3, 21:9
- **Duration**: 2, 3, 5, or 10 seconds
- **Resolution**: 480p, 720p, 1080p, 4K
- **Quality**: Standard, High, Premium

### 5. Generate Video
- Click "Generate Video" to start
- Monitor progress in real-time
- Download completed video

## API Integration

The app integrates with MuAPI for video generation:

```javascript
import { muapiVFX } from './lib/muapi.js'

// Upload image
const uploadResult = await muapiVFX.uploadFile(imageFile)

// Generate video
const generationResult = await muapiVFX.generateVFXEffect({
  image_url: uploadResult.url,
  effect_type: 'explosion',
  aspect_ratio: '16:9',
  duration: 3,
  resolution: '720p',
  quality: 'standard'
})

// Check progress
const status = await muapiVFX.checkGenerationStatus(generationResult.request_id)
```

## Architecture

```
apps/ai-vfx/
├── src/
│   ├── components/     # React components
│   │   ├── App.jsx        # Main application
│   │   ├── ApiKeyModal.jsx # API key configuration
│   │   ├── ImageUpload.jsx # File upload interface
│   │   ├── EffectGrid.jsx  # Effect selection
│   │   ├── SettingsPanel.jsx # Generation settings
│   │   ├── GenerationProgress.jsx # Progress tracking
│   │   ├── VideoPlayer.jsx # Video playback
│   │   └── ErrorBoundary.jsx # Error handling
│   ├── lib/
│   │   ├── muapi.js       # MuAPI client
│   │   └── effects.js     # Effect definitions
│   ├── styles/
│   │   └── main.css      # TailwindCSS styles
│   └── test/             # Test configuration
├── public/              # Static assets
├── package.json         # Dependencies
├── vite.config.js       # Build configuration
└── README.md           # This file
```

## Development

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run with coverage
pnpm test --coverage
```

### Code Quality
- ESLint for JavaScript/React linting
- Prettier for code formatting
- Vitest for unit testing
- Testing Library for component testing

## Deployment

The app is designed to be deployed as part of the Open Higgsfield monorepo:

1. Build the app: `pnpm run build:ai-vfx`
2. Files are copied to `public/apps/ai-vfx/`
3. Served via the main app's routing at `/apps/ai-vfx/`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the established testing patterns
2. Add tests for new features
3. Update documentation
4. Ensure accessibility compliance

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the test suite: `pnpm test`
- Review error logs in browser console
- Verify MuAPI key configuration
- Ensure stable internet connection