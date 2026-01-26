/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router";
import { AuthProvider, useAuth } from "./checkAuth";
import { LoginForm } from "./login";
import type { RoleType } from "./db/schema";
import type { ReactNode } from "react";
import { PasswordForm } from "./passwordForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TopBar } from "./topBar";
import { Toaster } from "sonner";

const Redirect = () => {
  const { user } = useAuth();

  if (user.newAccount) {
    return <Navigate to="/change-password" />;
  }

  return RoleMap[user.role as RoleType];
};

const RoleMap: Record<RoleType, ReactNode> = {
  admin: <App />,
  airline: <div>airline</div>,
  gate: <div>gate</div>,
  ground: <div>ground</div>,
};

const LoginCheck = () => {
  const { user } = useAuth();

  return user ? <Outlet /> : <Navigate to="/login" />;
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
              </Route>
              <Route path="/login" element={<LoginForm />} />
              <Route
                path="*"
                element={<div> Not Found or you do not have permission.</div>}
              />
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
