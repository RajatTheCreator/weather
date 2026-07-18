"use strict";

/* ===========================================================
   WeatherVerse — UI Module
   Renders weather data into the DOM, handles toasts,
   unit conversion, and the city search dropdown.
=========================================================== */

class UIManager {
  constructor() {
    this.unit = "C";
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.els = {
      loadingScreen: document.getElementById("loadingScreen"),
      authScreen: document.getElementById("authScreen"),
      locationScreen: document.getElementById("locationScreen"),
      dashboard: document.getElementById("dashboard"),

      cityInput: document.getElementById("cityInput"),
      citySuggestions: document.getElementById("citySuggestions"),
      searchCityBtn: document.getElementById("searchCityBtn"),
      allowLocationBtn: document.getElementById("allowLocationBtn"),
      changeLocationBtn: document.getElementById("changeLocationBtn"),
      refreshBtn: document.getElementById("refreshBtn"),

      cityName: document.getElementById("cityName"),
      countryName: document.getElementById("countryName"),
      weatherIcon: document.getElementById("weatherIcon"),
      temperature: document.getElementById("temperature"),
      weatherDescription: document.getElementById("weatherDescription"),
      feelsLikeLine: document.getElementById("feelsLikeLine"),
      lastUpdated: document.getElementById("lastUpdated"),
      humidity: document.getElementById("humidity"),
      wind: document.getElementById("wind"),
      rain: document.getElementById("rain"),
      feelsLike: document.getElementById("feelsLike"),
      forecastRow: document.getElementById("forecastRow"),
      unitToggle: document.getElementById("unitToggle"),
      toast: document.getElementById("toast"),
    };
  }

  bindEvents() {
    this.els.unitToggle?.addEventListener("click", (e) => {
      const btn = e.target.closest(".unit-btn");
      if (!btn) return;
      this.setUnit(btn.dataset.unit);
    });

    this.els.cityInput?.addEventListener("input", () => this.handleCitySearchInput());
  }

  /* =======================================================
     Screen transitions
  ======================================================= */
  showScreen(name) {
    ["loadingScreen", "authScreen", "locationScreen", "dashboard"].forEach((key) => {
      this.els[key]?.classList.toggle("hidden", key !== name);
    });
  }

  /* =======================================================
     Loading indicators on buttons
  ======================================================= */
  setButtonLoading(button, isLoading, loadingText = "Loading…") {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
      button.disabled = true;
    } else {
      if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
      button.disabled = false;
    }
  }

  spinRefresh(spin) {
    this.els.refreshBtn?.querySelector("i")?.classList.toggle("fa-spin", spin);
  }

  /* =======================================================
     Unit handling
  ======================================================= */
  setUnit(unit) {
    this.unit = unit;
    document.querySelectorAll(".unit-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.unit === unit);
    });
    if (window.AppState?.currentWeather) {
      this.updateDashboard(window.AppState.currentWeather);
    }
  }

  toF(celsius) {
    return Math.round((celsius * 9) / 5 + 32);
  }

  displayTemp(celsius) {
    return this.unit === "F" ? `${this.toF(celsius)}°` : `${Math.round(celsius)}°`;
  }

  /* =======================================================
     Dashboard rendering
  ======================================================= */
  updateDashboard(data) {
    if (!data) return;

    if (this.els.cityName) this.els.cityName.textContent = data.city;
    if (this.els.countryName) this.els.countryName.textContent = data.country;

    if (this.els.weatherIcon) {
      this.els.weatherIcon.innerHTML = `<i class="fa-solid ${data.icon}"></i>`;
    }

    if (this.els.temperature) this.els.temperature.textContent = this.displayTemp(data.temperature);
    if (this.els.weatherDescription) this.els.weatherDescription.textContent = data.description;
    if (this.els.feelsLikeLine) this.els.feelsLikeLine.textContent = `Feels like ${this.displayTemp(data.feelsLike)}`;

    if (this.els.humidity) this.els.humidity.textContent = `${data.humidity}%`;
    if (this.els.wind) this.els.wind.textContent = `${data.windSpeed} km/h`;
    if (this.els.rain) this.els.rain.textContent = `${data.rainChance ?? 0}%`;
    if (this.els.feelsLike) this.els.feelsLike.textContent = this.displayTemp(data.feelsLike);

    if (this.els.lastUpdated) {
      const t = new Date(data.updatedAt);
      this.els.lastUpdated.textContent = `Updated ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    this.renderForecast(data.daily);
  }

  renderForecast(daily = []) {
    if (!this.els.forecastRow) return;
    this.els.forecastRow.innerHTML = "";

    daily.forEach((day, i) => {
      const info = window.WeatherManager.describeCode(day.code, true);
      const date = new Date(day.date);
      const label = i === 0 ? "Today" : date.toLocaleDateString([], { weekday: "short" });

      const card = document.createElement("div");
      card.className = "forecast-day";
      card.innerHTML = `
        <div class="fday">${label}</div>
        <i class="fa-solid ${info.icon}"></i>
        <div class="frange">${this.displayTemp(day.max)} <span class="lo">${this.displayTemp(day.min)}</span></div>
      `;
      this.els.forecastRow.appendChild(card);
    });
  }

  /* =======================================================
     Theme (delegates the actual visuals to AnimationManager)
  ======================================================= */
  updateWeatherTheme(data) {
    window.WeatherVerse?.modules?.animations?.update(data);
  }

  /* =======================================================
     City search autocomplete
  ======================================================= */
  handleCitySearchInput() {
    clearTimeout(this._searchDebounce);
    const query = this.els.cityInput?.value || "";
    if (query.trim().length < 2) {
      this.hideSuggestions();
      return;
    }
    this._searchDebounce = setTimeout(async () => {
      const results = await window.WeatherVerse.modules.weather.searchCities(query);
      this.renderSuggestions(results);
    }, 350);
  }

  renderSuggestions(results) {
    if (!this.els.citySuggestions) return;
    if (!results.length) {
      this.hideSuggestions();
      return;
    }
    this.els.citySuggestions.innerHTML = results
      .map(
        (r, i) =>
          `<li data-index="${i}">${r.name}${r.admin1 ? ", " + r.admin1 : ""}, ${r.country}</li>`
      )
      .join("");
    this.els.citySuggestions.classList.remove("hidden");

    this.els.citySuggestions.querySelectorAll("li").forEach((li, i) => {
      li.addEventListener("click", () => {
        const place = results[i];
        this.hideSuggestions();
        if (this.els.cityInput) this.els.cityInput.value = `${place.name}, ${place.country}`;
        document.dispatchEvent(new CustomEvent("weatherverse:citySelected", { detail: place }));
      });
    });
  }

  hideSuggestions() {
    this.els.citySuggestions?.classList.add("hidden");
    if (this.els.citySuggestions) this.els.citySuggestions.innerHTML = "";
  }

  /* =======================================================
     Toasts
  ======================================================= */
  showToast(message, type = "success") {
    if (!this.els.toast) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.els.toast.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("leaving");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

window.UIManager = UIManager;