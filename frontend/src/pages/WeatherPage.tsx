import axios from "axios";
import {
  AlertTriangle,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Thermometer,
  Wind,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../features/auth/AuthContext";
import {
  createWeatherImpactTasks,
  listWeatherForecasts,
  syncWeatherForecasts,
} from "../features/weather/api";
import WeatherForecastList from "../features/weather/components/WeatherForecastList";
import WeatherImpactPanel from "../features/weather/components/WeatherImpactPanel";
import WeatherSyncButton from "../features/weather/components/WeatherSyncButton";
import type { WeatherForecast, WeatherImpact } from "../features/weather/types";

const getErrorMessage = (value: unknown, fallback: string) => {
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

const formatMetric = (value: number | null, suffix: string) =>
  value === null ? "N/A" : `${Number(value.toFixed(1))}${suffix}`;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not synced yet";
  }

  return new Date(value).toLocaleString();
};

const formatTaskMessage = (createdCount: number, skippedCount: number) => {
  if (createdCount === 0) {
    return skippedCount > 0
      ? `${skippedCount} weather task${skippedCount === 1 ? "" : "s"} already existed.`
      : "No actionable weather tasks to create.";
  }

  const createdCopy = `${createdCount} weather task${createdCount === 1 ? "" : "s"} created.`;
  const skippedCopy =
    skippedCount > 0
      ? ` ${skippedCount} existing task${skippedCount === 1 ? "" : "s"} skipped.`
      : "";

  return `${createdCopy}${skippedCopy}`;
};

const latestTimestamp = (forecasts: WeatherForecast[]) => {
  const timestamps = forecasts
    .map((forecast) => forecast.fetched_at ?? forecast.updated_at)
    .filter(Boolean)
    .sort();

  return timestamps[timestamps.length - 1] ?? null;
};

const maxBy = (
  forecasts: WeatherForecast[],
  getter: (forecast: WeatherForecast) => number | null
) =>
  forecasts.reduce<WeatherForecast | null>((current, forecast) => {
    const nextValue = getter(forecast);

    if (nextValue === null) {
      return current;
    }

    if (!current) {
      return forecast;
    }

    const currentValue = getter(current);
    return currentValue === null || nextValue > currentValue ? forecast : current;
  }, null);

// Purpose: farm-scoped weather decision board backed by saved Open-Meteo forecasts.
export default function WeatherPage() {
  const { farm, loading: authLoading } = useAuth();
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [impacts, setImpacts] = useState<WeatherImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");
  const [error, setError] = useState("");

  const hasCoordinates = Boolean(farm && farm.latitude !== null && farm.longitude !== null);

  const loadForecasts = useCallback(async () => {
    if (!farm) {
      setForecasts([]);
      setImpacts([]);
      setTaskMessage("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const payload = await listWeatherForecasts();
      setForecasts(payload.forecasts);
      setImpacts(payload.impacts);
    } catch (loadError) {
      console.error(loadError);
      setError(getErrorMessage(loadError, "Could not load weather forecast."));
    } finally {
      setLoading(false);
    }
  }, [farm]);

  useEffect(() => {
    if (!authLoading) {
      loadForecasts();
    }
  }, [authLoading, loadForecasts]);

  const currentForecast = forecasts[0] ?? null;
  const rainiestForecast = useMemo(
    () => maxBy(forecasts, (forecast) => forecast.rain_mm),
    [forecasts]
  );
  const hottestForecast = useMemo(
    () => maxBy(forecasts, (forecast) => forecast.temperature_max_c ?? forecast.temperature_c),
    [forecasts]
  );
  const windiestForecast = useMemo(
    () => maxBy(forecasts, (forecast) => forecast.wind_kph),
    [forecasts]
  );
  const lastUpdated = latestTimestamp(forecasts);
  const canCreateWeatherTasks = impacts.some((impact) => impact.severity !== "low");

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError("");
      const payload = await syncWeatherForecasts();
      setForecasts(payload.forecasts);
      setImpacts(payload.impacts);
      setTaskMessage("");
    } catch (syncError) {
      console.error(syncError);
      setError(getErrorMessage(syncError, "Could not sync weather."));
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateWeatherTasks = async () => {
    try {
      setCreatingTasks(true);
      setError("");
      const payload = await createWeatherImpactTasks();
      setTaskMessage(formatTaskMessage(payload.created_count, payload.skipped_count));
    } catch (taskError) {
      console.error(taskError);
      setError(getErrorMessage(taskError, "Could not create weather tasks."));
    } finally {
      setCreatingTasks(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Weather"
        description="Read farm conditions, forecast risks, and weather sync status from your saved farm location."
      />

      {error ? <p className="text-danger">{error}</p> : null}

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">Forecast center</span>
          <span className="card-icon">
            <CloudSun size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>{farm?.location ?? "Farm weather board"}</h2>
            <p>
              {hasCoordinates
                ? `Pinned at ${farm?.latitude?.toFixed(5)}, ${farm?.longitude?.toFixed(5)}.`
                : "Pin your farm location before syncing weather."}
            </p>
          </div>
          <div className="module-actions">
            <WeatherSyncButton syncing={syncing} disabled={!hasCoordinates} onSync={handleSync} />
            <Link className="ghost-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold" to="/farm-profile">
              <MapPin size={16} strokeWidth={2.2} />
              Farm Location
            </Link>
          </div>
        </div>
      </section>

      {!farm && !authLoading ? (
        <EmptyState
          title="No farm profile"
          description="Create or update your farm profile before syncing weather."
        />
      ) : null}

      {farm && !hasCoordinates ? (
        <section className="panel-card interactive-lift">
          <div className="inline-icon-row">
            <span className="card-icon">
              <MapPin size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h3>Farm location required</h3>
              <p className="card-copy">
                Use the map picker in your farm profile so weather sync can target the exact field location.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {authLoading || loading ? <Loader /> : null}

      {!loading && forecasts.length > 0 ? (
        <>
          <section className="grid-cards">
            <StatCard
              label="Current"
              value={formatMetric(currentForecast?.temperature_c ?? null, "°C")}
              note={currentForecast?.summary ?? "Latest saved forecast"}
              icon={Thermometer}
              strong
            />
            <StatCard
              label="Rain Peak"
              value={formatMetric(rainiestForecast?.rain_mm ?? null, " mm")}
              note={
                rainiestForecast?.rain_probability === null || rainiestForecast?.rain_probability === undefined
                  ? "Rain probability unavailable"
                  : `${rainiestForecast.rain_probability}% probability`
              }
              icon={CloudRain}
            />
            <StatCard
              label="Heat Peak"
              value={formatMetric(
                hottestForecast?.temperature_max_c ?? hottestForecast?.temperature_c ?? null,
                "°C"
              )}
              note="Highest forecast temperature."
              icon={AlertTriangle}
            />
            <StatCard
              label="Wind Peak"
              value={formatMetric(windiestForecast?.wind_kph ?? null, " kph")}
              note="Use this before spraying."
              icon={Wind}
            />
          </section>

          <section className="module-grid">
            <article className="feature-card feature-card-strong">
              <span className="card-icon">
                <Droplets size={18} strokeWidth={2.2} />
              </span>
              <h3 className="card-title">Last Updated</h3>
              <p className="card-copy">{formatDateTime(lastUpdated)}</p>
            </article>

            <article className="feature-card">
              <span className="card-icon card-icon-soft">
                <CloudSun size={18} strokeWidth={2.2} />
              </span>
              <h3 className="card-title">Forecast Window</h3>
              <p className="card-copy">
                {forecasts.length} day{forecasts.length === 1 ? "" : "s"} saved for this farm.
              </p>
            </article>
          </section>

          <WeatherImpactPanel
            impacts={impacts}
            creatingTasks={creatingTasks}
            canCreateTasks={canCreateWeatherTasks}
            taskMessage={taskMessage}
            tasksHref="/tasks?source=weather"
            onCreateTasks={handleCreateWeatherTasks}
          />

          <WeatherForecastList forecasts={forecasts} />
        </>
      ) : null}

      {!authLoading && !loading && farm && hasCoordinates && forecasts.length === 0 ? (
        <EmptyState
          title="No forecast saved"
          description="Sync weather to load the latest farm forecast from Open-Meteo."
        />
      ) : null}
    </div>
  );
}
