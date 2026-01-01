import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { VideoAnalysisProvider } from "./contexts/VideoAnalysisContext";


function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <VideoAnalysisProvider>
        <BrowserRouter basename={__BASE_PATH__}>
          <AppRoutes />
        </BrowserRouter>
      </VideoAnalysisProvider>
    </I18nextProvider>
  );
}

export default App;
