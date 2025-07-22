import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bizzin-ui-theme">
        <TooltipProvider>
          <Router>
            <Switch>
              <Route path="/"><Layout><HomePage /></Layout></Route>
              <Route path="/journal"><Layout><JournalPage /></Layout></Route>
              <Route path="/goals"><Layout><GoalsPage /></Layout></Route>
              <Route path="/training"><Layout><TrainingPage /></Layout></Route>
              <Route path="/docsafe"><Layout><DocSafePage /></Layout></Route>
              <Route><NotFound /></Route>
            </Switch>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
