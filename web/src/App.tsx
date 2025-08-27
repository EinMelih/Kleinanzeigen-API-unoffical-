import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./router";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
