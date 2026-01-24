/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./checkAuth";
import { LoginForm } from "./login";

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
          <Route index element={<Redirect />} />
          <Route path="/dog" element={<div>Dog route</div>}></Route>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/homepage" element={<App />} />
          <Route
            path="*"
            element={<div> Not Found or you do not have permission.</div>}
          />
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
