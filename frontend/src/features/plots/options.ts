// Purpose: shared select options for the Plot module form fields.
// Routing: used by plot create/edit components on /plots.

export const SOIL_TYPE_OPTIONS = [
  { value: "", label: "Select soil type" },
  { value: "Loamy", label: "Loamy" },
  { value: "Clay", label: "Clay" },
  { value: "Sandy", label: "Sandy" },
  { value: "Silty", label: "Silty" },
  { value: "Peaty", label: "Peaty" },
  { value: "Chalky", label: "Chalky" },
  { value: "Saline", label: "Saline" },
];

export const PLOT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "vacant", label: "Vacant" },
  { value: "resting", label: "Resting" },
  { value: "maintenance", label: "Maintenance" },
];
