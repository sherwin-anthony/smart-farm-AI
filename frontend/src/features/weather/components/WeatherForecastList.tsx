import { CloudRain, CloudSun, Droplets, Thermometer, Wind } from "lucide-react";
import type { WeatherForecast } from "../types";

type WeatherForecastListProps = {
  forecasts: WeatherForecast[];
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatNumber = (value: number | null, suffix: string) =>
  value === null ? "N/A" : `${Number(value.toFixed(1))}${suffix}`;

const getWeatherIcon = (forecast: WeatherForecast) => {
  if ((forecast.rain_mm ?? 0) >= 2 || (forecast.rain_probability ?? 0) >= 50) {
    return CloudRain;
  }

  return CloudSun;
};

export default function WeatherForecastList({ forecasts }: WeatherForecastListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {forecasts.map((forecast) => {
        const ForecastIcon = getWeatherIcon(forecast);

        return (
          <article key={forecast.id} className="preview-card interactive-lift rounded-3xl p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="card-icon card-icon-soft">
                  <ForecastIcon size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {formatDate(forecast.forecast_date)}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {forecast.summary ?? "Forecast available"}
                  </p>
                </div>
              </div>

              <span className="card-chip">
                {forecast.rain_probability === null
                  ? "Rain N/A"
                  : `${forecast.rain_probability}% rain`}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <Thermometer size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Temperature</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {forecast.temperature_min_c === null && forecast.temperature_max_c === null
                    ? formatNumber(forecast.temperature_c, "°C")
                    : `${formatNumber(forecast.temperature_min_c, "°C")} - ${formatNumber(
                        forecast.temperature_max_c,
                        "°C"
                      )}`}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <Droplets size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Rainfall</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatNumber(forecast.rain_mm, " mm")}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <Wind size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Wind</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatNumber(forecast.wind_kph, " kph")}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <Droplets size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Humidity</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {forecast.humidity === null ? "N/A" : `${forecast.humidity}%`}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
