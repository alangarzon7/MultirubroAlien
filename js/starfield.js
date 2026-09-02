// Interactive Cosmic Starfield & Nebula Particle Background
class Starfield {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.shootingStars = [];
    this.numStars = window.innerWidth < 768 ? 80 : 180;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    this.init();
    this.bindEvents();
    this.animate();
  }

  init() {
    this.resize();
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 0.3,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        color: Math.random() > 0.8 ? '#00ff66' : Math.random() > 0.6 ? '#a855f7' : Math.random() > 0.4 ? '#00f0ff' : '#ffffff'
      });
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });

    // Random shooting stars
    setInterval(() => {
      if (Math.random() > 0.5 && this.shootingStars.length < 2) {
        this.shootingStars.push({
          x: Math.random() * this.width * 0.8,
          y: Math.random() * (this.height * 0.4),
          length: Math.random() * 80 + 40,
          speed: Math.random() * 10 + 12,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
          alpha: 1
        });
      }
    }, 4000);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw static/twinkling stars
    for (let star of this.stars) {
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 1 || star.alpha < 0.2) {
        star.twinkleSpeed = -star.twinkleSpeed;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
      this.ctx.fillStyle = star.color;
      this.ctx.shadowBlur = star.color !== '#ffffff' ? 6 : 0;
      this.ctx.shadowColor = star.color;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Draw & update shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      let ss = this.shootingStars[i];
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.alpha -= 0.025;

      if (ss.alpha <= 0 || ss.x > this.width || ss.y > this.height) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = ss.alpha;
      const gradient = this.ctx.createLinearGradient(
        ss.x, ss.y,
        ss.x - Math.cos(ss.angle) * ss.length,
        ss.y - Math.sin(ss.angle) * ss.length
      );
      gradient.addColorStop(0, '#00ff66');
      gradient.addColorStop(0.5, '#00f0ff');
      gradient.addColorStop(1, 'transparent');

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(ss.x, ss.y);
      this.ctx.lineTo(
        ss.x - Math.cos(ss.angle) * ss.length,
        ss.y - Math.sin(ss.angle) * ss.length
      );
      this.ctx.stroke();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.Starfield = Starfield;
