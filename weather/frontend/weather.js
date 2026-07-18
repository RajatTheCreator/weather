"use strict";

/* ===========================================================
   WeatherVerse — Weather Module
   Powered by Open-Meteo (https://open-meteo.com) — free,
   no API key required, so this repo works out of the box
   with zero secrets to configure or leak.
   Reverse geocoding via BigDataCloud's free client API.
=========================================================== */

class WeatherManager {
  constructor() {
    this.FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
    this.GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
    this.REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";
  }

  /* =======================================================
     WMO Weather Code -> description / icon / theme
  ======================================================= */
  static describeCode(code, isDay = true) {
    const table = {
      0: { text: "Clear sky", icon: "fa-sun", theme: isDay ? "sunny" : "clear-night" },
      1: { text: "Mainly clear", icon: "fa-cloud-sun", theme: isDay ? "sunny" : "clear-night" },
      2: { text: "Partly cloudy", icon: "fa-cloud-sun", theme: "cloudy" },
      3: { text: "Overcast", icon: "fa-cloud", theme: "cloudy" },
      45: { text: "Fog", icon: "fa-smog", theme: "fog" },
      48: { text: "Depositing rime fog", icon: "fa-smog", theme: "fog" },
      51: { text: "Light drizzle", icon: "fa-cloud-rain", theme: "rainy" },
      53: { text: "Moderate drizzle", icon: "fa-cloud-rain", theme: "rainy" },
      55: { text: "Dense drizzle", icon: "fa-cloud-rain", theme: "rainy" },
      56: { text: "Freezing drizzle", icon: "fa-cloud-rain", theme: "rainy" },
      57: { text: "Dense freezing drizzle", icon: "fa-cloud-rain", theme: "rainy" },
      61: { text: "Slight rain", icon: "fa-cloud-rain", theme: "rainy" },
      63: { text: "Moderate rain", icon: "fa-cloud-showers-heavy", theme: "rainy" },
      65: { text: "Heavy rain", icon: "fa-cloud-showers-heavy", theme: "rainy" },
      66: { text: "Freezing rain", icon: "fa-cloud-showers-heavy", theme: "rainy" },
      67: { text: "Heavy freezing rain", icon: "fa-cloud-showers-heavy", theme: "rainy" },
      71: { text: "Slight snow", icon: "fa-snowflake", theme: "snow" },
      73: { text: "Moderate snow", icon: "fa-snowflake", theme: "snow" },
      75: { text: "Heavy snow", icon: "fa-snowflake", theme: "snow" },
      77: { text: "Snow grains", icon: "fa-snowflake", theme: "snow" },
      80: { text: "Slight rain showers", icon: "fa-cloud-showers-heavy", theme: "rainy" },
      81: { text: "Moderate rain showers", icon: "fa-cloud-showers-heavy", theme: "rainy" },
      82: { text: "Violent rain showers", icon: "fa-cloud-showers-heavy", theme: "storm" },
      85: { text: "Slight snow showers", icon: "fa-snowflake", theme: "snow" },
      86: { text: "Heavy snow showers", icon: "fa-snowflake", theme: "snow" },
      95: { text: "Thunderstorm", icon: "fa-cloud-bolt", theme: "storm" },
      96: { text: "Thunderstorm with hail", icon: "fa-cloud-bolt", theme: "storm" },
      99: { text: "Severe thunderstorm with hail", icon: "fa-cloud-bolt", theme: "storm" },
    };
    return table[code] || { text: "Unknown", icon: "fa-cloud", theme: "cloudy" };
  }

  async fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  /* =======================================================
     Current + forecast weather by coordinates
  ======================================================= */
  async fetchByCoordinates(latitude, longitude) {
    const params = new URLSearchParams({
      latitude,
      longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "auto",
      forecast_days: 7,
    });

    const data = await this.fetchJSON(`${this.FORECAST_URL}?${params.toString()}`);
    const place = await this.reverseGeocode(latitude, longitude);

    return this.normalize(data, place, latitude, longitude);
  }

  /* =======================================================
     Forward geocoding — city name search (autocomplete)
  ======================================================= */
  async searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    const params = new URLSearchParams({ name: query.trim(), count: 6, language: "en", format: "json" });
    try {
      const data = await this.fetchJSON(`${this.GEOCODE_URL}?${params.toString()}`);
      return (data.results || []).map((r) => ({
        name: r.name,
        country: r.country,
        admin1: r.admin1 || "",
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    } catch {
      return [];
    }
  }

  async fetchByCityName(name, latitude, longitude) {
    return this.fetchByCoordinates(latitude, longitude);
  }

  /* =======================================================
     Reverse geocoding — coordinates -> place name
  ======================================================= */
  async reverseGeocode(latitude, longitude) {
    try {
      const params = new URLSearchParams({ latitude, longitude, localityLanguage: "en" });
      const data = await this.fetchJSON(`${this.REVERSE_GEOCODE_URL}?${params.toString()}`);
      return {
        city: data.city || data.locality || data.principalSubdivision || "Unknown",
        country: data.countryName || "",
      };
    } catch {
      return { city: "Unknown location", country: "" };
    }
  }

  /* =======================================================
     Normalize Open-Meteo response into a flat shape the UI uses
  ======================================================= */
  normalize(data, place, latitude, longitude) {
    const c = data.current || {};
    const isDay = c.is_day === 1;
    const info = WeatherManager.describeCode(c.weather_code, isDay);

    const daily = (data.daily?.time || []).map((date, i) => ({
      date,
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      code: data.daily.weather_code[i],
      precipProbability: data.daily.precipitation_probability_max?.[i] ?? null,
    }));

    return {
      city: place.city,
      country: place.country,
      latitude,
      longitude,
      temperature: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m),
      precipitation: c.precipitation ?? 0,
      rainChance: daily[0]?.precipProbability ?? 0,
      code: c.weather_code,
      isDay,
      description: info.text,
      icon: info.icon,
      theme: info.theme,
      updatedAt: new Date().toISOString(),
      daily,
    };
  }
}

window.WeatherManager = WeatherManager;