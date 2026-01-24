/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { LoginForm } from "./login";
import { AuthProvider, useAuth } from "./checkAuth";

const Redirect = () => {
  const user = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <Navigate to="/homepage" />;
};

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Redirect />} />
          <Route path="/login " element={<LoginForm />} />
          <Route path="/homepage" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
