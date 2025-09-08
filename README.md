# PDF Editor - Advanced Web-Based PDF Editing Tool

A comprehensive, feature-rich PDF editor built with Next.js, React, and TypeScript. Edit PDFs directly in your browser with a modern, intuitive interface.

![PDF Editor Screenshot](https://via.placeholder.com/800x400/f3f4f6/1f2937?text=PDF+Editor+Interface)

## 🚀 Features

### Core Functionality
- **📄 PDF Upload & Display**: Drag-and-drop or click to upload PDF files
- **🖼️ High-Quality Rendering**: Smooth PDF page rendering with PDF.js
- **🔍 Zoom Controls**: Zoom in/out with 25% increments (50% - 300%)
- **📖 Page Navigation**: Navigate through pages with thumbnails and controls

### Editing Tools
- **✏️ Text Annotations**: Add custom text with adjustable font size and family
- **🎨 Highlighting**: Highlight text areas with customizable colors
- **📐 Shape Tools**: Draw rectangles and circles for annotations
- **🎯 Selection Tool**: Select, move, and delete annotations
- **🎨 Color Picker**: Choose from preset colors or use custom color picker

### Advanced Features
- **↩️ Undo/Redo**: Full history management with keyboard shortcuts
- **⌨️ Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Z`: Undo
  - `Ctrl/Cmd + Shift + Z`: Redo
  - `Ctrl/Cmd + S`: Save PDF
  - `Ctrl/Cmd + O`: Open file
  - `Delete/Backspace`: Delete selected annotation
  - `←/→`: Navigate pages
- **🌙 Dark Mode**: Toggle between light and dark themes
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **💾 Export PDF**: Save edited PDF with all annotations preserved

### User Interface
- **🎨 Modern UI**: Clean, professional interface with Tailwind CSS
- **📁 Sidebar Navigation**: Organized tools and page thumbnails
- **🔧 Tool Settings**: Contextual settings for different annotation types
- **📊 Status Indicators**: Current page, zoom level, and file information

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: 
  - PDF.js (rendering)
  - PDF-lib (editing and export)
- **UI Components**: 
  - Lucide React (icons)
  - React Dropzone (file upload)
- **File Operations**: FileSaver.js

## 📋 Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

## 🚀 Getting Started

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ShalomObongo/PDFEditor.git
   cd PDFEditor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📖 Usage Guide

### Basic Workflow

1. **Upload a PDF**:
   - Drag and drop a PDF file onto the upload area
   - Or click "Choose File" to select from your computer

2. **Select a Tool**:
   - **Select**: Click to select and move annotations
   - **Text**: Click to add text annotations
   - **Highlight**: Click and drag to highlight areas
   - **Rectangle**: Click and drag to draw rectangles
   - **Circle**: Click and drag to draw circles

3. **Customize Annotations**:
   - Choose colors from the palette or use custom colors
   - Adjust text settings (font size, family)
   - Use undo/redo for corrections

4. **Navigate Pages**:
   - Use page thumbnails in the sidebar
   - Click page navigation controls
   - Use keyboard arrow keys

5. **Save Your Work**:
   - Click "Download" to save the edited PDF
   - All annotations are permanently embedded

### Advanced Features

#### Keyboard Shortcuts
- `Ctrl/Cmd + Z`: Undo last action
- `Ctrl/Cmd + Shift + Z`: Redo action
- `Ctrl/Cmd + S`: Download edited PDF
- `Ctrl/Cmd + O`: Open new PDF file
- `Delete` or `Backspace`: Delete selected annotation
- `←` / `→`: Navigate between pages

#### Tool-Specific Controls
- **Text Tool**: Click to place text, double-click existing text to edit
- **Shape Tools**: Click and drag to create shapes
- **Selection Tool**: Click annotations to select, delete key to remove

## 🏗️ Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main application page
├── components/
│   ├── PDFEditor.tsx        # Main PDF editor component
│   ├── PageThumbnail.tsx    # Page thumbnail component
│   └── Toolbar.tsx          # Tools and settings sidebar
└── utils/
    └── pdfUtils.ts          # PDF processing utilities
```

## 🎨 Customization

### Adding New Tools

1. **Update Tool Interface**:
   ```typescript
   // In src/components/Toolbar.tsx
   export interface Tool {
     type: 'select' | 'text' | 'highlight' | 'rectangle' | 'circle' | 'your-new-tool';
     color: string;
   }
   ```

2. **Add Tool Configuration**:
   ```typescript
   const tools = [
     // ... existing tools
     { type: 'your-new-tool', icon: YourIcon, label: 'Your Tool', description: 'Tool description' }
   ];
   ```

3. **Implement Tool Logic**:
   Update the annotation rendering and creation logic in `PDFUtils.ts`

### Styling Modifications

The application uses Tailwind CSS. Modify styles by:
- Updating Tailwind classes in components
- Customizing the theme in `tailwind.config.js`
- Adding custom CSS in `globals.css`

## 🔧 Configuration

### PDF.js Worker Configuration

The PDF.js worker is automatically configured to use the CDN version:

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

For offline usage, download the worker file and update the path.

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
NEXT_PUBLIC_APP_NAME="PDF Editor"
NEXT_PUBLIC_MAX_FILE_SIZE=50000000  # 50MB in bytes
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Azure Static Web Apps

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📦 Dependencies

### Core Dependencies
- `next`: React framework
- `react` & `react-dom`: React library
- `typescript`: Type safety
- `tailwindcss`: Styling framework

### PDF Processing
- `pdfjs-dist`: PDF rendering
- `pdf-lib`: PDF editing and manipulation

### UI & Utilities
- `lucide-react`: Icon library
- `react-dropzone`: File upload component
- `file-saver`: File download utility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Large PDF files (>50MB) may cause performance issues
- Some complex PDF forms may not render perfectly
- Mobile touch interactions for drawing could be improved

## 🔮 Future Enhancements

### Planned Features
- [ ] Multi-document tab support
- [ ] Cloud storage integration (Google Drive, Dropbox)
- [ ] Form filling capabilities
- [ ] Digital signature support
- [ ] Page manipulation (add, delete, reorder pages)
- [ ] Export to different formats (PNG, JPEG)
- [ ] Collaboration features
- [ ] Advanced text editing (rich text formatting)
- [ ] Template system for common annotations

### Performance Improvements
- [ ] Lazy loading for large documents
- [ ] Web Workers for heavy processing
- [ ] Progressive loading of pages
- [ ] Memory optimization for large files

## 💡 Tips & Tricks

### Performance Optimization
- Keep PDF files under 25MB for best performance
- Use zoom levels between 75%-150% for optimal editing
- Close unused browser tabs when working with large files

### Best Practices
- Save your work frequently (Ctrl/Cmd + S)
- Use high contrast colors for better visibility
- Test annotations at different zoom levels
- Preview the final PDF before sharing

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check the documentation
- Join our community discussions

## 🙏 Acknowledgments

- PDF.js team for the excellent PDF rendering library
- PDF-lib contributors for PDF manipulation capabilities
- Tailwind CSS team for the utility-first framework
- Lucide team for the beautiful icon set
- Next.js team for the amazing React framework

---

**Built with ❤️ using Next.js, React, and TypeScript**
