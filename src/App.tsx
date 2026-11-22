import { Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import GramaOnePage from "./components/GramaOnePage";
import HeroBanner from "./components/HeroBanner";
import HomePage from "./components/HomePage";
import OnboardingSetup from "./components/OnboardingSetup";
import MatchFeed from "./components/MatchFeed";
import MembersPage from "./components/MembersPage";
import PlansPage from "./components/PlansPage";
import PrivacyBar from "./components/PrivacyBar";
import ReferPage from "./components/ReferPage";
import SchemeWatcher from "./components/SchemeWatcher";
import TopBar from "./components/TopBar";
import UrgentPopupHost from "./components/UrgentPopupHost";
import { HouseholdProvider, useHousehold } from "./state/householdStore";
import { NotificationProvider } from "./state/notificationStore";
import { SchemeProvider } from "./state/schemeStore";
import { TrackerProvider } from "./state/trackerStore";

function AppShell() {
  const { pathname } = useLocation();
  // Home ("/") renders its own hero, so the shared HeroBanner only shows on Matches.
  const showHero = pathname === "/matches";

  return (
    <div className="yr-app">
      <TopBar />
      <PrivacyBar />
      {showHero && <HeroBanner />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/matches" element={<MatchFeed />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/grama-one" element={<GramaOnePage />} />
        <Route path="/admin/schemes" element={<SchemeWatcher />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/refer" element={<ReferPage />} />
      </Routes>
      <UrgentPopupHost />
      <BottomNav />
    </div>
  );
}

/** Opens the onboarding wizard until onboarding is complete, then the main app. */
function SessionGate() {
  const { onboardingComplete } = useHousehold();

  if (!onboardingComplete) {
    return (
      <div className="yr-app">
        <OnboardingSetup />
      </div>
    );
  }
  return <AppShell />;
}

export default function App() {
  return (
    <HouseholdProvider>
      <NotificationProvider>
        <SchemeProvider>
          <TrackerProvider>
            <SessionGate />
          </TrackerProvider>
        </SchemeProvider>
      </NotificationProvider>
    </HouseholdProvider>
  );
}
