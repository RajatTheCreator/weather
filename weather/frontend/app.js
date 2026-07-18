"use strict";

/* ===========================================================
   WeatherVerse — Application Controller
   Single, linear boot flow:
   Loader -> (restore session?) -> Auth -> Location -> Dashboard
=========================================================== */

const APP_CONFIG = {
  APP_NAME: "WeatherVerse",
  VERSION: "2.0.0",
  LOADER_DURATION: 1600,
  LOCATION_TIMEOUT: 10000,
  REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
};

window.AppState = {
  authenticated: false,
  currentUser: null,
  currentWeather: null,
  latitude: null,
  longitude: null,
};

class WeatherVerseApp {
  constructor() {
    this.modules = {};
    this.refreshTimer = null;
    this.init();
  }

  async init() {
    console.log(`%c${APP_CONFIG.APP_NAME} v${APP_CONFIG.VERSION}`, "color:#4F8CFF;font-size:16px;font-weight:bold;");

    this.modules.auth = new AuthManager();
    this.modules.weather = new WeatherManager();
    this.modules.animations = new AnimationManager();
    this.modules.ui = new UIManager();

    this.bindGlobalEvents();

    await this.wait(APP_CONFIG.LOADER_DURATION);

    if (this.modules.auth.checkSession()) {
      this.modules.auth.loadRememberedUser();
      this.goToLocationOrDashboard();
    } else {
      this.modules.auth.loadRememberedUser();
      this.modules.ui.showScreen("authScreen");
    }
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  bindGlobalEvents() {
    document.addEventListener("weatherverse:authenticated", () => {
      this.goToLocationOrDashboard();
    });

    document.getElementById("allowLocationBtn")?.addEventListener("click", () => this.useMyLocation());
    document.getElementById("searchCityBtn")?.addEventListener("click", () => this.searchTypedCity());
    document.getElementById("cityInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.searchTypedCity();
      }
    });

    document.addEventListener("weatherverse:citySelected", (e) => this.loadWeatherForPlace(e.detail));

    document.getElementById("changeLocationBtn")?.addEventListener("click", () => {
      this.stopAutoRefresh();
      this.modules.ui.showScreen("locationScreen");
    });

    document.getElementById("refreshBtn")?.addEventListener("click", () => this.refreshWeather());

    this.modules.auth.setupLogout();
  }

  goToLocationOrDashboard() {
    const savedCoords = this.getSavedCoordinates();
    if (savedCoords) {
      this.loadWeatherForCoords(savedCoords.latitude, savedCoords.longitude);
    } else {
      this.modules.ui.showScreen("locationScreen");
    }
  }

  getSavedCoordinates() {
    try {
      const raw = localStorage.getItem("weatherverse-lastlocation");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveCoordinates(latitude, longitude) {
    localStorage.setItem("weatherverse-lastlocation", JSON.stringify({ latitude, longitude }));
  }

  /* =======================================================
     Geolocation flow
  ======================================================= */
  useMyLocation() {
    const btn = document.getElementById("allowLocationBtn");
    this.modules.ui.setButtonLoading(btn, true, "Locating…");

    if (!navigator.geolocation) {
      this.modules.ui.setButtonLoading(btn, false);
      this.modules.ui.showToast("Geolocation isn't supported on this device.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.modules.ui.setButtonLoading(btn, false);
        this.loadWeatherForCoords(position.coords.latitude, position.coords.longitude);
      },
      () => {
        this.modules.ui.setButtonLoading(btn, false);
        this.modules.ui.showToast("Location denied — search for a city instead.", "error");
      },
      { timeout: APP_CONFIG.LOCATION_TIMEOUT }
    );
  }

  async searchTypedCity() {
    const input = document.getElementById("cityInput");
    const query = input?.value.trim();
    if (!query) return;

    const btn = document.getElementById("searchCityBtn");
    this.modules.ui.setButtonLoading(btn, true, "");

    const results = await this.modules.weather.searchCities(query);
    this.modules.ui.setButtonLoading(btn, false);

    if (!results.length) {
      this.modules.ui.showToast("No matching city found. Try another spelling.", "error");
      return;
    }
    this.modules.ui.hideSuggestions();
    this.loadWeatherForPlace(results[0]);
  }

  loadWeatherForPlace(place) {
    this.loadWeatherForCoords(place.latitude, place.longitude);
  }

  /* =======================================================
     Core weather fetch + render
  ======================================================= */
  async loadWeatherForCoords(latitude, longitude) {
    try {
      this.modules.ui.spinRefresh(true);
      const data = await this.modules.weather.fetchByCoordinates(latitude, longitude);

      window.AppState.currentWeather = data;
      window.AppState.latitude = latitude;
      window.AppState.longitude = longitude;
      this.saveCoordinates(latitude, longitude);

      this.modules.ui.updateDashboard(data);
      this.modules.ui.updateWeatherTheme(data);
      this.modules.ui.showScreen("dashboard");
      this.modules.ui.spinRefresh(false);

      this.startAutoRefresh(latitude, longitude);
    } catch (error) {
      console.error("Weather fetch failed:", error);
      this.modules.ui.spinRefresh(false);
      this.modules.ui.showToast("Couldn't fetch weather right now. Please try again.", "error");
    }
  }

  refreshWeather() {
    if (window.AppState.latitude == null) return;
    this.loadWeatherForCoords(window.AppState.latitude, window.AppState.longitude);
  }

  startAutoRefresh(latitude, longitude) {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => {
      this.loadWeatherForCoords(latitude, longitude);
    }, APP_CONFIG.REFRESH_INTERVAL);
  }

  stopAutoRefresh() {
    clearInterval(this.refreshTimer);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.WeatherVerse = new WeatherVerseApp();
});