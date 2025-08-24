import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Auth from "@/pages/Auth";
import Cookies from "@/pages/Cookies";
import Dashboard from "@/pages/Dashboard";
import Health from "@/pages/Health";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/health" element={<Health />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
