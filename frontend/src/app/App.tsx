import { MainProviders } from "./providers";
import AppRouter from "./routes/AppRouter";
import "./styles/index.css";

const App = () => {
    return (
        <>
            <MainProviders>
                <AppRouter />
            </MainProviders>
        </>
    );
};

export default App;
