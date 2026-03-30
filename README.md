# Personal Website

This repository contains a static personal website ready for GitHub Pages.

## Fluid Simulation Attribution

The fluid background simulation used on this site is derived from the original
WebGL fluid simulation work by Pavel Dobryakov (PavelDoGreat).

- Original project: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
- Original author: Pavel Dobryakov
- This repository includes adapted/integrated versions for use as a website
	background and UI experience.

## Structure

- `index.html`: homepage at repository root
- `apps/`: utility web apps
- `style/`: shared app styles
- `papers.bib`: publications data source used by the homepage

## Deployment

GitHub Actions deploys the site using `.github/workflows/deploy.yml`.

## License

The derived fluid simulation portions remain under the [MIT license](LICENSE)
from the original project.
