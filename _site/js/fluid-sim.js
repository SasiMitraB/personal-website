// Fluid Simulation for Homepage Background
// Inspired by Jos Stam's stable fluids algorithm

class FluidSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.width = canvas.width;
    this.height = canvas.height;

    // Simulation parameters
    this.gridSize = 4; // Size of each grid cell in pixels
    this.cols = Math.ceil(this.width / this.gridSize);
    this.rows = Math.ceil(this.height / this.gridSize);

    // Grids for velocity and density
    this.velocityX = new Float32Array(this.cols * this.rows);
    this.velocityY = new Float32Array(this.cols * this.rows);
    this.density = new Float32Array(this.cols * this.rows);

    this.velocityXTemp = new Float32Array(this.cols * this.rows);
    this.velocityYTemp = new Float32Array(this.cols * this.rows);
    this.densityTemp = new Float32Array(this.cols * this.rows);

    // Simulation constants
    this.diffusion = 0.0001;
    this.viscosity = 0.0001;
    this.decay = 0.99; // Dissipation rate for ink effect
    this.force = 50;

    // Color configuration for neon green theme
    this.colorMin = [0, 255, 0, 0.1];      // RGBA for low density
    this.colorMax = [0, 255, 0, 1.0];      // RGBA for high density (bright neon green)
    this.glowColor = [0, 255, 0];           // RGB for glow effect

    // Scroll interaction
    this.lastScrollY = 0;
    this.scrollVelocity = 0;
    this.scrollInputAmount = 0;
    this.setupScrollListener();

    // Animation
    this.isAnimating = true;
    this.animate();
  }

  setupScrollListener() {
    const throttleDelay = 16; // ~60fps
    let lastTime = 0;
    let scrollInputTimer = null;

    window.addEventListener('scroll', () => {
      const now = Date.now();
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;

      if (now - lastTime > throttleDelay) {
        this.scrollVelocity = (currentScrollY - this.lastScrollY) / throttleDelay;
        this.lastScrollY = currentScrollY;
        this.scrollInputAmount = Math.abs(this.scrollVelocity) * 0.5;
        lastTime = now;
      }
    });
  }

  getIndex(x, y) {
    x = Math.max(0, Math.min(x, this.cols - 1));
    y = Math.max(0, Math.min(y, this.rows - 1));
    return y * this.cols + x;
  }

  addDensity(x, y, amount) {
    const idx = this.getIndex(x, y);
    this.density[idx] += amount;
  }

  addVelocity(x, y, vx, vy) {
    const idx = this.getIndex(x, y);
    this.velocityX[idx] += vx;
    this.velocityY[idx] += vy;
  }

  diffuse(field, tempField) {
    const a = this.diffusion * this.cols * this.rows;
    const c = 1 + 4 * a;

    for (let i = 0; i < 10; i++) { // Iterations for stability
      for (let y = 1; y < this.rows - 1; y++) {
        for (let x = 1; x < this.cols - 1; x++) {
          const idx = this.getIndex(x, y);
          const left = this.getIndex(x - 1, y);
          const right = this.getIndex(x + 1, y);
          const up = this.getIndex(x, y - 1);
          const down = this.getIndex(x, y + 1);

          tempField[idx] = (field[idx] + a * (tempField[left] + tempField[right] + tempField[up] + tempField[down])) / c;
        }
      }
    }

    // Swap arrays
    const temp = field.slice();
    field.set(tempField);
    tempField.set(temp);
  }

  project(velocityX, velocityY) {
    const div = new Float32Array(this.cols * this.rows);
    const p = new Float32Array(this.cols * this.rows);

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const idx = this.getIndex(x, y);
        const left = this.getIndex(x - 1, y);
        const right = this.getIndex(x + 1, y);
        const up = this.getIndex(x, y - 1);
        const down = this.getIndex(x, y + 1);

        div[idx] = -0.5 * (
          velocityX[right] - velocityX[left] +
          velocityY[down] - velocityY[up]
        );
      }
    }

    // Gauss-Seidel iteration
    for (let iter = 0; iter < 10; iter++) {
      for (let y = 1; y < this.rows - 1; y++) {
        for (let x = 1; x < this.cols - 1; x++) {
          const idx = this.getIndex(x, y);
          const left = this.getIndex(x - 1, y);
          const right = this.getIndex(x + 1, y);
          const up = this.getIndex(x, y - 1);
          const down = this.getIndex(x, y + 1);

          p[idx] = (div[idx] + p[left] + p[right] + p[up] + p[down]) / 4;
        }
      }
    }

    // Subtract pressure gradient from velocity
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const idx = this.getIndex(x, y);
        const right = this.getIndex(x + 1, y);
        const down = this.getIndex(x, y + 1);

        velocityX[idx] -= 0.5 * (p[right] - p[left]);
        velocityY[idx] -= 0.5 * (p[down] - p[up]);
      }
    }
  }

  advect(field, velocityX, velocityY) {
    const dt = 1;
    const tempField = field.slice();

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const idx = this.getIndex(x, y);
        const u = velocityX[idx];
        const v = velocityY[idx];

        let backX = x - dt * u;
        let backY = y - dt * v;

        backX = Math.max(0.5, Math.min(this.cols - 1.5, backX));
        backY = Math.max(0.5, Math.min(this.rows - 1.5, backY));

        const x0 = Math.floor(backX);
        const x1 = x0 + 1;
        const y0 = Math.floor(backY);
        const y1 = y0 + 1;

        const sx = backX - x0;
        const sy = backY - y0;

        const v00 = field[this.getIndex(x0, y0)];
        const v10 = field[this.getIndex(x1, y0)];
        const v01 = field[this.getIndex(x0, y1)];
        const v11 = field[this.getIndex(x1, y1)];

        const v0 = (1 - sx) * v00 + sx * v10;
        const v1 = (1 - sx) * v01 + sx * v11;

        tempField[idx] = (1 - sy) * v0 + sy * v1;
      }
    }

    field.set(tempField);
  }

  step() {
    // Add scroll-based input
    if (this.scrollInputAmount > 0) {
      const centerX = this.cols / 2;
      const centerY = this.rows / 2;
      const radius = 15;

      for (let y = Math.max(0, centerY - radius); y < Math.min(this.rows, centerY + radius); y++) {
        for (let x = Math.max(0, centerX - radius); x < Math.min(this.cols, centerX + radius); x++) {
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (dist < radius) {
            const force = this.force * this.scrollInputAmount * (1 - dist / radius);
            this.addDensity(x, y, force);
            this.addVelocity(x, y, 0, Math.sign(this.scrollVelocity) * force * 0.5);
          }
        }
      }

      this.scrollInputAmount *= 0.95; // Decay
    }

    // Velocity diffusion
    this.diffuse(this.velocityX, this.velocityXTemp);
    this.diffuse(this.velocityY, this.velocityYTemp);

    // Project to make velocity field divergence-free
    this.project(this.velocityX, this.velocityY);

    // Advect velocity
    this.advect(this.velocityX, this.velocityX, this.velocityY);
    this.advect(this.velocityY, this.velocityX, this.velocityY);

    // Project again after advection
    this.project(this.velocityX, this.velocityY);

    // Density advection and dissipation
    this.advect(this.density, this.velocityX, this.velocityY);

    // Apply decay for ink effect
    for (let i = 0; i < this.density.length; i++) {
      this.density[i] *= this.decay;
    }
  }

  render() {
    const imageData = this.ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    // Clear background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 30;      // R: dark background
      data[i + 1] = 30;  // G
      data[i + 2] = 30;  // B
      data[i + 3] = 255; // A
    }

    // Render density grid
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const density = Math.min(1, this.density[idx]);

        // Map density to brightness
        const brightness = Math.sqrt(density); // Non-linear for better visuals

        // Create glow effect
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            for (let py = 0; py < this.gridSize; py++) {
              for (let px = 0; px < this.gridSize; px++) {
                const px_canvas = x * this.gridSize + px;
                const py_canvas = y * this.gridSize + py;

                if (px_canvas < this.width && py_canvas < this.height) {
                  const pixelIdx = (py_canvas * this.width + px_canvas) * 4;

                  // Blend with existing color
                  const glowFactor = brightness * 0.8;
                  data[pixelIdx] = Math.max(data[pixelIdx], glowFactor * 50);    // R
                  data[pixelIdx + 1] = Math.max(data[pixelIdx + 1], glowFactor * 255); // G (neon green)
                  data[pixelIdx + 2] = Math.max(data[pixelIdx + 2], glowFactor * 50); // B
                  data[pixelIdx + 3] = 255; // A
                }
              }
            }
          }
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  animate = () => {
    if (!this.isAnimating) return;

    this.step();
    this.render();

    requestAnimationFrame(this.animate);
  }

  handleResize() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.cols = Math.ceil(this.width / this.gridSize);
    this.rows = Math.ceil(this.height / this.gridSize);

    // Reinitialize grids
    this.velocityX = new Float32Array(this.cols * this.rows);
    this.velocityY = new Float32Array(this.cols * this.rows);
    this.density = new Float32Array(this.cols * this.rows);
    this.velocityXTemp = new Float32Array(this.cols * this.rows);
    this.velocityYTemp = new Float32Array(this.cols * this.rows);
    this.densityTemp = new Float32Array(this.cols * this.rows);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (window.fluidSim) {
      window.fluidSim.handleResize();
    }
  };

  // Initial size
  resizeCanvas();

  // Initialize fluid simulation
  window.fluidSim = new FluidSimulation(canvas);

  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
  });
});
