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

    // Mouse interaction
    this.mouseX = 0;
    this.mouseY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.setupMouseListener();

    // Animation
    this.isAnimating = true;
    this.animate();
  }

  setupMouseListener() {
    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = this.mouseX;
      this.lastMouseY = this.mouseY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Reset mouse position when leaving window
    document.addEventListener('mouseleave', () => {
      this.mouseX = -1000;
      this.mouseY = -1000;
    });

    // Add initial animation on startup
    this.addInitialActivity();
  }

  addInitialActivity() {
    // Add some initial bursts to make the fluid visible
    const centerX = this.cols / 2;
    const centerY = this.rows / 2;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const offsetX = (Math.random() - 0.5) * this.cols * 0.4;
        const offsetY = (Math.random() - 0.5) * this.rows * 0.2;
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        const force = this.force * 0.8;

        // Add density in a small region
        for (let dy = -10; dy <= 10; dy++) {
          for (let dx = -10; dx <= 10; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10) {
              this.addDensity(x + dx, y + dy, force * (1 - dist / 10));
              this.addVelocity(x + dx, y + dy, dx * 0.5, dy * 0.5);
            }
          }
        }
      }, i * 600);
    }
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
    // Add mouse-based input
    if (this.mouseX > 0 && this.mouseY > 0) {
      // Convert mouse position to grid coordinates
      const gridX = this.mouseX / this.gridSize;
      const gridY = this.mouseY / this.gridSize;

      // Calculate mouse velocity
      const velX = (this.mouseX - this.lastMouseX) * 0.5;
      const velY = (this.mouseY - this.lastMouseY) * 0.5;

      // Add force around mouse position
      const radius = 20;

      for (let y = Math.max(0, gridY - radius); y < Math.min(this.rows, gridY + radius); y++) {
        for (let x = Math.max(0, gridX - radius); x < Math.min(this.cols, gridX + radius); x++) {
          const dist = Math.sqrt((x - gridX) ** 2 + (y - gridY) ** 2);
          if (dist < radius) {
            const strength = (1 - dist / radius);
            this.addDensity(x, y, this.force * strength * 0.5);
            this.addVelocity(x, y, velX * strength * 0.1, velY * strength * 0.1);
          }
        }
      }
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
      data[i] = 15;      // R: very dark background
      data[i + 1] = 15;  // G
      data[i + 2] = 15;  // B
      data[i + 3] = 255; // A
    }

    // Render density grid
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const density = Math.min(1, this.density[idx]);

        if (density > 0.01) {
          // Map density to brightness with more aggressive curve
          const brightness = density * density; // Squared for more contrast

          // Paint the grid cell
          for (let py = 0; py < this.gridSize; py++) {
            for (let px = 0; px < this.gridSize; px++) {
              const px_canvas = x * this.gridSize + px;
              const py_canvas = y * this.gridSize + py;

              if (px_canvas < this.width && py_canvas < this.height) {
                const pixelIdx = (py_canvas * this.width + px_canvas) * 4;

                // Render with bright neon green
                const greenValue = 50 + brightness * 205; // Green from 50 to 255
                const redValue = brightness * 100;         // Red glow
                const blueValue = brightness * 50;         // Slight blue

                data[pixelIdx] = Math.max(data[pixelIdx], redValue);
                data[pixelIdx + 1] = Math.max(data[pixelIdx + 1], greenValue);
                data[pixelIdx + 2] = Math.max(data[pixelIdx + 2], blueValue);
                data[pixelIdx + 3] = 255;
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
