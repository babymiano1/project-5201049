
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import AIParsing from "../pages/ai-parsing/page";
import CreationSetup from "../pages/creation-setup/page";
import PerformanceStage from "../pages/performance-stage/page";
import AchievementCenter from "../pages/achievement-center/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/ai-parsing",
    element: <AIParsing />,
  },
  {
    path: "/creation-setup",
    element: <CreationSetup />,
  },
  {
    path: "/performance-stage",
    element: <PerformanceStage />,
  },
  {
    path: "/achievement-center",
    element: <AchievementCenter />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
