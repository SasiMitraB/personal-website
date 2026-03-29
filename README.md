# Personal Website

A portfolio website built with Eleventy featuring an interactive fluid simulation background on the homepage.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

Install dependencies:
```bash
npm install
```

## Development

### Run the Development Server

Start the Eleventy dev server with live reload:
```bash
npm start
```

This will start a local server at `http://localhost:8080` and automatically rebuild the site when you make changes.

Alternatively:
```bash
npm run serve
```

### Build for Production

Generate the static site output to the `_site/` directory:
```bash
npm run build
```

## Features

- **Eleventy Static Site Generator** - Fast, flexible, and zero-config by default
- **Interactive Fluid Simulation** - Scroll-triggered background animation with neon green aesthetic
- **Hacker Theme** - Terminal-inspired design with green text on dark background
- **Web Apps** - Integrated functional apps (BibTeX Merger, Markdown to PDF)
- **GitHub Pages Ready** - Pre-configured for deployment to GitHub Pages

## File Structure

```
.
├── _includes/        # Nunjucks templates
│   └── base.njk     # Main layout template
├── _site/           # Built output (generated)
├── css/             # Stylesheets
├── js/              # JavaScript files
│   └── fluid-sim.js # Fluid simulation engine
├── apps/            # Web applications
├── img/             # Images
├── .eleventy.js     # Eleventy configuration
├── index.md         # Homepage content
└── package.json     # Project dependencies
```

## customization

- Edit `index.md` to update homepage content
- Modify `css/style.css` for styling changes
- The fluid simulation parameters can be tuned in `js/fluid-sim.js` (gridSize, dissipation, viscosity, etc.)

## Deployment

The site is configured for GitHub Pages with the path prefix `/personal-website/`. To deploy:

1. Build the site: `npm run build`
2. Commit changes: `git add . && git commit -m "Your message"`
3. Push to GitHub: `git push origin main`

GitHub Actions will automatically deploy based on the workflow in `.github/workflows/`.
