import "./DefaultTheme.scss";
import { Header } from './header/header'
import { Footer } from './footer'
import { registerTheme } from "app/web/thirdparty/theme";

export const DefaultTheme = ({ children }: { children?: React.ReactNode }) => {
    return (
        <div className="theme-default">
            <Header />
            <main className="theme-content">
                {children}
            </main>
            <Footer />
        </div>
    );
};

registerTheme('default', DefaultTheme);