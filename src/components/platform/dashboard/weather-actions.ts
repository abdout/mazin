"use server"

import type { WeatherCondition, ForecastDay, WeatherConditionType } from "./weather"

// ============================================================================
// TYPES
// ============================================================================

export interface WeatherData {
  current: WeatherCondition
  forecast: ForecastDay[]
  location: string
}

// ============================================================================
// WEATHER CONDITION MAPPING
// ============================================================================

/**
 * Maps OpenWeatherMap condition codes to our WeatherConditionType
 * @see https://openweathermap.org/weather-conditions
 */
function mapCondition(id: number): WeatherConditionType {
  // Thunderstorm (200-299)
  if (id >= 200 && id < 300) return "stormy"
  // Drizzle (300-399)
  if (id >= 300 && id < 400) return "rainy"
  // Rain (500-599)
  if (id >= 500 && id < 505) return "rainy"
  if (id >= 505 && id < 600) return "pouring"
  // Snow (600-699)
  if (id >= 600 && id < 700) return "snowy"
  // Atmosphere - fog, mist, haze (700-799)
  if (id >= 700 && id < 800) return "foggy"
  // Clear (800)
  if (id === 800) return "sunny"
  // Clouds (801-804)
  if (id === 801) return "partlycloudy"
  if (id >= 802) return "cloudy"
  // Default
  return "sunny"
}

/**
 * Capitalizes the first letter of a weather description
 */
function capitalizeDescription(description: string): string {
  return description.charAt(0).toUpperCase() + description.slice(1)
}

// ============================================================================
// DEFAULT WEATHER DATA (Sudan/Port Sudan region)
// ============================================================================

const defaultWeatherData: WeatherData = {
  current: {
    day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    condition: "sunny",
    conditionLabel: "Sunny",
    temperature: 32,
    tempLow: 24,
    humidity: 35,
    rainChance: 5,
    windSpeed: 15,
  },
  forecast: [
    { day: "Tue", condition: "sunny", temp: 33 },
    { day: "Wed", condition: "partlycloudy", temp: 31 },
    { day: "Thu", condition: "sunny", temp: 34 },
    { day: "Fri", condition: "sunny", temp: 35 },
    { day: "Sat", condition: "partlycloudy", temp: 32 },
    { day: "Sun", condition: "sunny", temp: 33 },
  ],
  location: "Port Sudan",
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Fetches weather data from OpenWeatherMap API
 * Uses Port Sudan coordinates by default
 * Falls back to default data if API is unavailable
 *
 * @param units - Temperature units: "metric" (°C) or "imperial" (°F)
 * @returns Weather data or default values
 */
export async function getWeatherData(
  units: "metric" | "imperial" = "metric"
): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY

  // If no API key, return default data
  if (!apiKey) {
    console.warn("[Weather] OPENWEATHERMAP_API_KEY not configured, using defaults")
    return defaultWeatherData
  }

  // Port Sudan coordinates
  const lat = 19.6158
  const lon = 37.2164

  try {
    const url = new URL("https://api.openweathermap.org/data/3.0/onecall")
    url.searchParams.set("lat", lat.toString())
    url.searchParams.set("lon", lon.toString())
    url.searchParams.set("units", units)
    url.searchParams.set("exclude", "minutely,hourly,alerts")
    url.searchParams.set("appid", apiKey)

    const response = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // 30-minute cache
    })

    if (!response.ok) {
      console.error("[Weather] API error:", response.status)
      return defaultWeatherData
    }

    const data = await response.json()

    // Map current weather
    const currentWeather = data.current.weather[0]
    const current: WeatherCondition = {
      day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      condition: mapCondition(currentWeather.id),
      conditionLabel: capitalizeDescription(currentWeather.description),
      temperature: Math.round(data.current.temp),
      tempLow: Math.round(data.daily[0].temp.min),
      humidity: data.current.humidity,
      rainChance: Math.round(data.daily[0].pop * 100),
      windSpeed: Math.round(
        data.current.wind_speed * (units === "metric" ? 3.6 : 1)
      ),
    }

    // Map 6-day forecast (skip today)
    const forecast: ForecastDay[] = data.daily
      .slice(1, 7)
      .map((day: any) => {
        const date = new Date(day.dt * 1000)
        const dayWeather = day.weather[0]
        return {
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          condition: mapCondition(dayWeather.id),
          temp: Math.round(day.temp.day),
        }
      })

    return {
      current,
      forecast,
      location: "Port Sudan",
    }
  } catch (error) {
    console.error("[Weather] Fetch error:", error)
    return defaultWeatherData
  }
}

/**
 * Refreshes weather data (cache-busting version)
 */
export async function refreshWeather(
  units: "metric" | "imperial" = "metric"
): Promise<WeatherData> {
  return getWeatherData(units)
}
