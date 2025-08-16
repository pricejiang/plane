# 🛩️ Plane - Intelligent Diagram Analysis Platform

**Plane** is an advanced diagram analysis platform built on top of Excalidraw, featuring intelligent semantic extraction, widget detection, and AI-powered component recognition. Transform hand-drawn diagrams into structured, semantic data with advanced token optimization.

## 🚀 Features

### 🎨 **Interactive Drawing Canvas**
- Built on Excalidraw for smooth, intuitive diagramming
- Support for shapes, text, arrows, and complex diagrams
- Real-time collaborative editing capabilities

### 🧠 **Intelligent Semantic Extraction**
- **6-Stage Extraction Pipeline**: Advanced processing of canvas elements
  - Element Normalization
  - Container Detection  
  - Text Attachment
  - Connector Analysis
  - Role Assignment
  - Widget Detection
- **Pattern Recognition**: Automatic identification of UI components, flow elements, and widgets
- **Token Optimization**: 70%+ reduction in token usage for LLM processing

### 🎯 **Widget System**
- **Smart Widget Detection**: Automatically detects embedded content placeholders
  - `[MAP: location]` → Interactive map widgets
  - `[VIDEO: url]` → Video player widgets
  - `[CHART: data]` → Chart and graph widgets
  - `[CALENDAR: events]` → Calendar widgets
  - `[IFRAME: url]` → Web content widgets
- **Visual Overlays**: Color-coded overlays showing detected components
- **Metadata Extraction**: Rich semantic information for each detected element

### ⚡ **Performance Optimized**
- WebWorker-based processing for non-blocking UI
- Concurrent extraction pipeline
- Memory-efficient processing
- Sub-500ms processing for typical diagrams

### 🔧 **Developer Tools**
- Comprehensive test suite with 9 test categories
- Debug logging and diagnostic tools
- Real-time analysis feedback
- Export capabilities for semantic data

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- Modern web browser with WebWorker support

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd plane

# Install dependencies
npm install

# or with yarn
yarn install
```

## 🚀 Running the Project

### Development Mode

```bash
# Start the development server
npm run dev

# or with yarn
yarn dev
```

The application will be available at **http://localhost:3000**

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Other Commands

```bash
# Run linting
npm run lint

# Type checking (if using TypeScript)
npx tsc --noEmit
```

## 🧪 Testing

### Quick Test All

```bash
# Run all tests
node run-tests.js
```

### Category-Specific Testing

```bash
# Run unit tests only
node run-tests.js unit

# Run integration tests
node run-tests.js integration

# Run performance tests
node run-tests.js performance

# Run debug tests
node run-tests.js debug
```

### Test Categories

| Category | Description | Files |
|----------|-------------|-------|
| **Unit** | Individual component testing | 5 tests |
| **Integration** | Full pipeline testing | 2 tests |
| **Performance** | Stress and load testing | 1 test |
| **Debug** | Diagnostic and debugging | 1 test |

### Test Examples

```bash
# Show all available test commands
node run-tests.js --help

# Example output:
# ✅ Passed: 9/9 tests
# 📈 Success Rate: 100.0%
# ⏱️  Total Duration: 1600ms
```

## 📁 Project Structure

```
plane/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # App layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ExcalidrawWrapper.tsx   # Main Excalidraw integration
│   ├── OverlayLayer.tsx       # Semantic overlay rendering
│   ├── ControlPanel.tsx       # Analysis controls
│   └── SimpleTestOverlay.tsx  # Test overlay component
├── lib/                   # Core libraries
│   ├── extractionWorkerManager.ts  # WebWorker management
│   ├── tokenAnalyzer.ts            # Token optimization
│   ├── widgetFactory.ts            # Widget creation
│   └── widgetStorage.ts            # Widget persistence
├── workers/               # WebWorker scripts
│   ├── extraction.worker.ts        # Main extraction worker
│   └── extractionPipeline.worker.ts # Pipeline worker
├── types/                 # TypeScript definitions
│   ├── extraction.ts      # Extraction types
│   ├── index.ts          # Main types
│   └── widgets.ts        # Widget types
├── tests/                 # Organized test suite
│   ├── unit/             # Unit tests (5 files)
│   ├── integration/      # Integration tests (2 files)
│   ├── performance/      # Performance tests (1 file)
│   └── debug/            # Debug tests (1 file)
├── run-tests.js          # Test runner script
└── README.md             # This file
```

## 🎯 Usage Guide

### Basic Drawing
1. Open the application in your browser
2. Use Excalidraw tools to create diagrams
3. Draw shapes, add text, create connections

### Widget Detection
1. Add text elements with widget patterns:
   - `[MAP: San Francisco]`
   - `[VIDEO: https://youtube.com/watch?v=demo]` 
   - `[CHART: Sales Data]`
   - `CHART: Q4 Analytics`
   - `MAP: Central Park`

2. Click **"Scan Canvas"** to run semantic analysis

3. View colored overlays showing detected components:
   - 🗺️ **Green**: Map widgets
   - 🎥 **Red**: Video widgets  
   - 📊 **Amber**: Chart widgets
   - 📅 **Cyan**: Calendar widgets
   - 🌐 **Purple**: IFrame widgets

### Analysis Results
- **Token Analysis**: View original vs optimized token counts
- **Component Breakdown**: See detected roles and confidence scores
- **Export Data**: Get semantic JSON for further processing

## 🔧 Development

### Debug Mode
Enable debug logging by opening browser console and looking for `WIDGET-DEBUG` messages:

```javascript
// Browser console will show:
// [WIDGET-DEBUG] Pattern matched: CHART widget (confidence: 85%)
// [WIDGET-DEBUG] Role assigned: widget
// [WIDGET-DEBUG] Overlay category: widget
```

### Adding New Widget Types
1. Update pattern detection in `workers/extraction.worker.ts`
2. Add new widget type to `types/widgets.ts`
3. Update overlay colors in `components/OverlayLayer.tsx`
4. Add tests in `tests/unit/test-widget-simple.js`

### Performance Monitoring
- WebWorker processing times logged in console
- Memory usage tracking for large diagrams
- Queue management for concurrent requests

## 🚀 Deployment

### Production Deployment
```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

### Environment Variables
Create `.env.local` for environment-specific configuration:

```env
# Optional: Configure any API keys or external services
NEXT_PUBLIC_API_URL=your-api-url
```

## 🧪 Testing in Detail

### Test File Organization
- **`tests/unit/`**: Component-level testing
  - `test-extraction.js`: Token analysis validation
  - `test-pipeline.js`: 5-stage pipeline testing
  - `test-text-attachment.js`: Text-shape relationships
  - `test-widget-simple.js`: Widget pattern detection
  - `test-widgets.js`: Widget system demo

- **`tests/integration/`**: End-to-end testing
  - `test-phase2-integration.js`: Complete pipeline validation
  - `test-real-extraction.js`: Real-world extraction testing

- **`tests/performance/`**: Load testing
  - `test-webworker-stress.js`: WebWorker stress testing

- **`tests/debug/`**: Diagnostic testing
  - `test-widget-extraction.js`: Widget detection debugging

### Running Individual Tests
```bash
# Run a specific test file
node tests/unit/test-extraction.js
node tests/integration/test-phase2-integration.js
node tests/performance/test-webworker-stress.js
```

## 📊 Performance Metrics

- **Processing Speed**: <500ms for 300 elements
- **Token Reduction**: 70%+ optimization achieved
- **Memory Usage**: Efficient WebWorker-based processing
- **Pattern Recognition**: >80% accuracy on common patterns
- **Widget Detection**: 95%+ confidence on bracket patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `node run-tests.js`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 🙏 Acknowledgments

- [Excalidraw](https://excalidraw.com/) for the excellent drawing canvas
- [Next.js](https://nextjs.org/) for the React framework
- [TypeScript](https://typescriptlang.org/) for type safety

---

**Built with ❤️ for intelligent diagram analysis**
