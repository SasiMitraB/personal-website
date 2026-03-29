# Applications Guide

This folder contains two recovered and modernized web applications integrated into the personal website.

## Applications

### 1. BibTeX Merge Machine
**Location:** `/apps/bibtex-merger/`

A tool for merging multiple BibTeX files based on citations in a LaTeX `.aux` file.

**Features:**
- Drag & drop file upload
- Parse `.aux` files to identify cited references
- Merge multiple `.bib` files based on citations
- Identify missing references
- Download consolidated `master_references.bib`
- All processing done in-browser (no server upload)

**How to Use:**
1. Upload your `.aux` file from your LaTeX project
2. Upload all `.bib` files you want to merge
3. Click "Generate Master File"
4. Download the merged `master_references.bib`

**Technical:**
- Pure JavaScript implementation
- No server-side processing required
- BibTeX parsing with regex-based key extraction
- HTML5 FileReader API for local file processing

---

### 2. Markdown to PDF Converter
**Location:** `/apps/markdown-to-pdf/`

A live Markdown editor with LaTeX support and PDF export functionality.

**Features:**
- Split-pane editor with live preview
- Full Markdown support (GFM)
- LaTeX/KaTeX math rendering ($...$ for inline, $$...$$ for display)
- Multiple preview themes (Default, GitHub, Newspaper)
- Drag & drop file loading
- Browser-based PDF generation via print dialog
- Theme persistence with localStorage

**How to Use:**
1. Type or paste Markdown in the left editor pane
2. See live preview on the right
3. Use theme selector to change preview styling
4. Click "Generate PDF" to export as PDF via browser print dialog

**Technical:**
- [Marked.js](https://marked.js.org/) for Markdown parsing
- [KaTeX](https://katex.org/) for LaTeX math rendering
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization
- Custom CSS for print styling

---

## Design System

Both applications use the modern design system defined in `/style/design-system.css`:

**Color Palette:**
- Background: `#030811` (deep dark blue)
- Text: `#f8fafc` (light)
- Accent: `#38bdf8` (cyan)
- Error: `#ff6b6b` (red)
- Success: `#4ade80` (green)
- Warning: `#facc15` (yellow)
- Info: `#3b82f6` (blue)

**Typography:**
- Font: Inter (Google Fonts)
- Monospace: Monaco / Menlo / Consolas

**Components:**
- Glass panels with backdrop blur
- Pill-shaped buttons with hover effects
- Glass morphism for inputs and selectors
- Responsive grid layouts

---

## Navigation

Both apps have back buttons to return to the home page:
- Home page: `/`
- BibTeX Merge Machine: `/apps/bibtex-merger/`
- Markdown to PDF: `/apps/markdown-to-pdf/`

Main site navigation includes links to both apps:
- Header shows "BibTeX" and "PDF" links
- Opens in same tab by default

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires JavaScript enabled
- Uses modern CSS features (CSS variables, grid, backdrop-filter)

---

## Performance

- Total app CSS: ~7.5 KB (design-system.css)
- No Tailwind CSS bloat
- Minimal dependencies:
  - Marked.js: ~31 KB (minified)
  - KaTeX: ~95 KB (CSS + JS)
  - DOMPurify: ~5 KB

---

## Future Enhancements

Potential improvements:
- [ ] Export BibTeX merge results as JSON
- [ ] Markdown editor theme customization
- [ ] Syntax highlighting in editor
- [ ] Support for additional Markdown extensions
- [ ] BibTeX validation and formatting
- [ ] Batch file processing UI improvements

---

## Development Notes

To modify styling:
1. Edit `/style/design-system.css` for shared components
2. Edit individual app `index.html` `<style>` sections for app-specific styles

To change colors globally:
1. Update CSS variables in `design-system.css` `:root` block
2. Apply to all apps automatically

To add new apps:
1. Create folder in `/apps/`
2. Import `../style/design-system.css`
3. Use existing component classes
4. Add link to main site header navigation
