import { useCallback, useEffect, useState } from "react";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import { createFarm, deleteFarm, listFarms } from "../features/farms/api";
import FarmForm from "../features/farms/components/FarmForm";
import FarmList from "../features/farms/components/FarmList";
import type { Farm, FarmPayload } from "../features/farms/types";

// Purpose: page container for the Farms module.
// Routing: rendered by the frontend route /farms in src/app/router.tsx.
export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadFarms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listFarms();
      setFarms(data);
    } catch (err) {
      console.error(err);
      setError("Could not load farms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleCreateFarm = async (payload: FarmPayload) => {
    try {
      setSubmitting(true);
      setError("");
      await createFarm(payload);
      await loadFarms();
    } catch (err) {
      console.error(err);
      setError("Could not create farm.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = async (id: number) => {
    try {
      setDeletingId(id);
      setError("");
      await deleteFarm(id);
      await loadFarms();
    } catch (err) {
      console.error(err);
      setError("Could not delete farm.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Farms"
        description="Create farms first. Plots, weather, and recommendations will attach here later."
      />

      <FarmForm onSubmit={handleCreateFarm} submitting={submitting} />

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {loading ? <Loader /> : <FarmList farms={farms} deletingId={deletingId} onDelete={handleDeleteFarm} />}
    </div>
  );
}
