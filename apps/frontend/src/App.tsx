import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ChatPage } from "./pages/ChatPage";
import { RekapPage } from "./pages/RekapPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true,   element: <Dashboard /> },
      { path: "chat",  element: <ChatPage />  },
      { path: "rekap", element: <RekapPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
