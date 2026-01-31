/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import "./index.css";
import { createRoot } from "react-dom/client";
import { AdminPage } from "./pages/AdminPage";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router";
import { AuthProvider, useAuth } from "./queries/checkAuth";
import { LoginForm } from "./pages/login";
import { type RoleType } from "./db/schema";
import { useContext, type ReactNode } from "react";
import { PasswordForm } from "./pages/passwordForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TopBar } from "./topBar";
import { Toaster } from "sonner";
import { NotFound } from "./pages/404";
import { Forbidden } from "./pages/403";
import { UsersPage } from "./pages/UsersPage";
import { FlightPage } from "./pages/flightPage";
import { PassengerPage } from "./pages/PassengerPage";
import { AirlinePage } from "./pages/AirlinePage";
import { GatePage } from "./pages/GatePage";
import { Flight } from "./pages/Flight";
import { GroundFlight } from "./pages/GroundFlight";
import { BagsPage } from "./pages/BagsPage";

const Redirect = () => {
  const { user } = useAuth();

  if (user.newAccount) {
    return <Navigate to="/change-password" />;
  }

  return RoleMap[user.role as RoleType];
};

const RoleMap: Record<RoleType, ReactNode> = {
  admin: <AdminPage />,
  airline: <AirlinePage />,
  gate: <GatePage />,
  ground: <GatePage />,
};

const LoginCheck = () => {
  const { user } = useAuth();

  return user ? <Outlet /> : <Navigate to="/login" />;
};

const RoleCheck = (props: { roles: RoleType[] }) => {
  const { user } = useAuth();

  if (props.roles.includes(user.role as RoleType)) {
    return <Outlet />;
  }

  return <Forbidden />;
};

const FlightRedirect = () => {
  const { user } = useAuth();
  return user.role === "gate" ? <Flight /> : <GroundFlight />;
};

const queryClient = new QueryClient();

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route
              element={
                <>
                  <TopBar />
                  <Outlet />
                </>
              }
            >
              <Route element={<LoginCheck />}>
                <Route path="/" element={<Redirect />} />
                <Route path="/change-password" element={<PasswordForm />} />
                <Route element={<RoleCheck roles={["admin"]} />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/flights" element={<FlightPage />} />
                  <Route path="/passengers" element={<PassengerPage />} />
                </Route>
                <Route element={<RoleCheck roles={["gate", "ground"]} />}>
                  <Route path="/flights/:id" element={<FlightRedirect />} />
                </Route>
                <Route element={<RoleCheck roles={["ground"]} />}>
                  <Route path="/bags" element={<BagsPage />} />
                </Route>
              </Route>
              <Route path="/login" element={<LoginForm />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
