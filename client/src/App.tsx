import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { JournalPage } from "@/pages/JournalPage";
import { GoalsPage } from "@/pages/GoalsPage";
import { TrainingPage } from "@/pages/TrainingPage";
import { DocSafePage } from "@/pages/DocSafePage";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bizzin-ui-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="docsafe" element={<DocSafePage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
