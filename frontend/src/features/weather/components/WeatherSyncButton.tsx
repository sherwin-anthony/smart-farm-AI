import { RefreshCw } from "lucide-react";

type WeatherSyncButtonProps = {
  syncing: boolean;
  disabled?: boolean;
  onSync: () => Promise<void>;
};

export default function WeatherSyncButton({
  syncing,
  disabled = false,
  onSync,
}: WeatherSyncButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={onSync}
      disabled={disabled || syncing}
    >
      <RefreshCw size={16} strokeWidth={2.2} />
      {syncing ? "Syncing..." : "Sync Weather"}
    </button>
  );
}
