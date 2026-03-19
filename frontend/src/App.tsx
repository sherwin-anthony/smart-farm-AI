import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";

// Purpose: root frontend app entry.
// Routing: renders the React route tree defined in src/app/router.tsx.
export default function App() {
  return <RouterProvider router={router} />;
}
