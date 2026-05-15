// hero-animation.js - Particle Network with Proper Edge Constraints

(function () {
  "use strict";

  let canvas, ctx, particles, animationId;
  const particleCount = 100;
  const connectionDistance = 150;
  const mouseRadius = 200;
  const edgeMargin = 100; // Larger margin to keep particles away from edges
  let mouse = { x: null, y: null };

  class Particle {
    constructor(canvasWidth, canvasHeight) {
      // Spawn particles only in safe zone (away from edges)
      const safeWidth = canvasWidth - edgeMargin * 2;
      const safeHeight = canvasHeight - edgeMargin * 2;

      this.x = edgeMargin + Math.random() * safeWidth;
      this.y = edgeMargin + Math.random() * safeHeight;
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = (Math.random() - 0.5) * 1;
      this.radius = Math.random() * 2 + 1;
      this.originalVx = this.vx;
      this.originalVy = this.vy;
    }

    update(canvasWidth, canvasHeight) {
      // Move particle
      this.x += this.vx;
      this.y += this.vy;

      // Strong bounce from edges with margin
      const minX = edgeMargin;
      const maxX = canvasWidth - edgeMargin;
      const minY = edgeMargin;
      const maxY = canvasHeight - edgeMargin;

      // Bounce on X axis
      if (this.x <= minX) {
        this.x = minX;
        this.vx = Math.abs(this.vx); // Force positive velocity
      } else if (this.x >= maxX) {
        this.x = maxX;
        this.vx = -Math.abs(this.vx); // Force negative velocity
      }

      // Bounce on Y axis
      if (this.y <= minY) {
        this.y = minY;
        this.vy = Math.abs(this.vy); // Force positive velocity
      } else if (this.y >= maxY) {
        this.y = maxY;
        this.vy = -Math.abs(this.vy); // Force negative velocity
      }

      // Add soft boundary repulsion (extra safety)
      const repulsionStrength = 0.1;
      const repulsionZone = edgeMargin * 0.5;

      if (this.x < minX + repulsionZone) {
        this.vx += repulsionStrength * (1 - (this.x - minX) / repulsionZone);
      } else if (this.x > maxX - repulsionZone) {
        this.vx -= repulsionStrength * (1 - (maxX - this.x) / repulsionZone);
      }

      if (this.y < minY + repulsionZone) {
        this.vy += repulsionStrength * (1 - (this.y - minY) / repulsionZone);
      } else if (this.y > maxY - repulsionZone) {
        this.vy -= repulsionStrength * (1 - (maxY - this.y) / repulsionZone);
      }

      // Limit velocity
      const maxVelocity = 2;
      const velocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (velocity > maxVelocity) {
        this.vx = (this.vx / velocity) * maxVelocity;
        this.vy = (this.vy / velocity) * maxVelocity;
      }

      // Ensure minimum velocity
      const minVelocity = 0.3;
      if (velocity < minVelocity && velocity > 0) {
        this.vx = (this.vx / velocity) * minVelocity;
        this.vy = (this.vy / velocity) * minVelocity;
      }
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#3FB950";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#3FB950";
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function initCanvas() {
    const heroSection = document.querySelector(".hero-section");
    if (!heroSection) return;

    // Create canvas
    canvas = document.createElement("canvas");
    canvas.id = "particle-canvas";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "1";

    heroSection.insertBefore(canvas, heroSection.firstChild);
    ctx = canvas.getContext("2d");

    resizeCanvas();
    initParticles();

    // Event listeners
    window.addEventListener("resize", handleResize);
    heroSection.addEventListener("mousemove", handleMouseMove);
    heroSection.addEventListener("mouseleave", handleMouseLeave);

    // Start animation
    animate();
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function handleResize() {
    resizeCanvas();
    initParticles();
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function handleMouseLeave() {
    mouse.x = null;
    mouse.y = null;
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const opacity = 1 - distance / connectionDistance;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(63, 185, 80, ${opacity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function handleMouseInteraction() {
    if (mouse.x === null || mouse.y === null) {
      return;
    }

    particles.forEach((particle) => {
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouseRadius) {
        // Push particles away from mouse
        const force = (mouseRadius - distance) / mouseRadius;
        const angle = Math.atan2(dy, dx);
        particle.vx -= Math.cos(angle) * force * 3;
        particle.vy -= Math.sin(angle) * force * 3;
      }
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particles.forEach((particle) => {
      particle.update(canvas.width, canvas.height);
      particle.draw(ctx);
    });

    // Draw connections
    drawConnections();

    // Handle mouse interaction
    handleMouseInteraction();

    animationId = requestAnimationFrame(animate);
  }

  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener("resize", handleResize);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeEventListener("mousemove", handleMouseMove);
      canvas.parentNode.removeEventListener("mouseleave", handleMouseLeave);
      canvas.remove();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCanvas);
  } else {
    initCanvas();
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", cleanup);
})();
