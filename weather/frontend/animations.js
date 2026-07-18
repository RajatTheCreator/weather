"use strict";

/* ===========================================================
   WeatherVerse — Animation Module
   Generates ambient background effects (stars, clouds, rain,
   snow, floating particles, lightning) driven by real weather.
=========================================================== */

class AnimationManager {
  constructor() {
    this.layers = {
      star: document.getElementById("starLayer"),
      cloud: document.getElementById("cloudLayer"),
      rain: document.getElementById("rainLayer"),
      snow: document.getElementById("snowLayer"),
      particle: document.getElementById("particleLayer"),
    };
    this.lightningTimer = null;
    this.buildAmbientParticles();
  }

  clearLayer(layer) {
    if (this.layers[layer]) this.layers[layer].innerHTML = "";
  }

  clearAll() {
    Object.keys(this.layers).forEach((l) => this.clearLayer(l));
    clearInterval(this.lightningTimer);
    document.querySelector(".lightning-flash")?.remove();
  }

  /* =======================================================
     Ambient floating particles (always on, subtle)
  ======================================================= */
  buildAmbientParticles() {
    const layer = this.layers.particle;
    if (!layer) return;
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const size = 2 + Math.random() * 4;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDuration = `${4 + Math.random() * 6}s`;
      p.style.animationDelay = `${Math.random() * 4}s`;
      layer.appendChild(p);
    }
  }

  /* =======================================================
     Stars (night themes)
  ======================================================= */
  buildStars(count = 90) {
    const layer = this.layers.star;
    this.clearLayer("star");
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("div");
      s.className = "star";
      const size = Math.random() * 2 + 1;
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 70}%`;
      s.style.animationDuration = `${1.5 + Math.random() * 3}s`;
      s.style.animationDelay = `${Math.random() * 3}s`;
      layer.appendChild(s);
    }
  }

  /* =======================================================
     Clouds (cloudy / overcast / fog)
  ======================================================= */
  buildClouds(count = 6) {
    const layer = this.layers.cloud;
    this.clearLayer("cloud");
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const cloud = document.createElement("div");
      cloud.className = "cloud";
      const w = 120 + Math.random() * 180;
      const h = w * 0.4;
      cloud.style.width = `${w}px`;
      cloud.style.height = `${h}px`;
      cloud.style.top = `${Math.random() * 50}%`;
      cloud.style.animationDuration = `${40 + Math.random() * 40}s`;
      cloud.style.animationDelay = `${-Math.random() * 40}s`;
      layer.appendChild(cloud);
    }
  }

  /* =======================================================
     Rain
  ======================================================= */
  buildRain(count = 90) {
    const layer = this.layers.rain;
    this.clearLayer("rain");
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const drop = document.createElement("div");
      drop.className = "drop";
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.height = `${40 + Math.random() * 40}px`;
      drop.style.animationDuration = `${0.4 + Math.random() * 0.5}s`;
      drop.style.animationDelay = `${Math.random() * 2}s`;
      layer.appendChild(drop);
    }
  }

  /* =======================================================
     Snow
  ======================================================= */
  buildSnow(count = 70) {
    const layer = this.layers.snow;
    this.clearLayer("snow");
    if (!layer) return;
    const flakes = ["❄", "❅", "❆"];
    for (let i = 0; i < count; i++) {
      const flake = document.createElement("div");
      flake.className = "flake";
      flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.fontSize = `${8 + Math.random() * 14}px`;
      flake.style.setProperty("--drift", `${(Math.random() - 0.5) * 120}px`);
      flake.style.animationDuration = `${5 + Math.random() * 6}s`;
      flake.style.animationDelay = `${Math.random() * 5}s`;
      flake.style.opacity = 0.5 + Math.random() * 0.5;
      layer.appendChild(flake);
    }
  }

  /* =======================================================
     Lightning flashes (storms)
  ======================================================= */
  startLightning() {
    clearInterval(this.lightningTimer);
    let flash = document.querySelector(".lightning-flash");
    if (!flash) {
      flash = document.createElement("div");
      flash.className = "lightning-flash";
      document.body.appendChild(flash);
    }
    this.lightningTimer = setInterval(() => {
      if (Math.random() > 0.6) {
        flash.style.transition = "none";
        flash.style.opacity = "0.85";
        requestAnimationFrame(() => {
          flash.style.transition = "opacity .6s ease";
          flash.style.opacity = "0";
        });
      }
    }, 2600);
  }

  /* =======================================================
     Apply a full ambience for a given weather "theme"
  ======================================================= */
  applyTheme(theme) {
    this.clearAll();
    document.body.className = `theme-${theme}`;

    switch (theme) {
      case "clear-night":
        this.buildStars(110);
        break;
      case "cloudy":
      case "fog":
        this.buildClouds(7);
        break;
      case "rainy":
        this.buildClouds(4);
        this.buildRain(100);
        break;
      case "snow":
        this.buildClouds(3);
        this.buildSnow(80);
        break;
      case "storm":
        this.buildClouds(6);
        this.buildRain(130);
        this.startLightning();
        break;
      case "sunny":
      default:
        this.buildClouds(2);
        break;
    }

    this.buildAmbientParticles();
  }

  /* =======================================================
     Update animations from live weather data
  ======================================================= */
  update(weatherData) {
    if (!weatherData) return;
    this.applyTheme(weatherData.theme);
  }
}

window.AnimationManager = AnimationManager;