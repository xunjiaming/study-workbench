import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Today from "./pages/Today";
import Library from "./pages/Library";
import Observation from "./pages/Observation";
import ProfilePage from "./pages/ProfilePage";
import Me from "./pages/Me";

export const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: "/", element: <Today /> },
        { path: "/library", element: <Library /> },
        { path: "/observation", element: <Observation /> },
        { path: "/profile", element: <ProfilePage /> },
        { path: "/me", element: <Me /> },
      ],
    },
  ],
  { basename: "/study-workbench/app" },
);