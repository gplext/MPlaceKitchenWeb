import { Route, Switch } from "wouter";
import { BagProvider } from "./bag";
import { CatalogProvider } from "./catalog";
import { Layout } from "./components/Layout";
import { AccountPage } from "./pages/Account";
import { AdminPage } from "./pages/admin/AdminPage";
import { BagPage } from "./pages/Bag";
import { HomePage } from "./pages/Home";
import { MenuPage } from "./pages/Menu";
import { NotFoundPage } from "./pages/NotFound";
import { OrderPlacedPage } from "./pages/OrderPlaced";
import { ProductPage } from "./pages/Product";
import { SignInPage } from "./pages/SignIn";

export default function App() {
  return (
    <CatalogProvider>
      <BagProvider>
        <Layout>
          <Switch>
            <Route path="/"><HomePage /></Route>
            <Route path="/menu"><MenuPage /></Route>
            <Route path="/menu/:slug"><MenuPage /></Route>
            <Route path="/product/:slug"><ProductPage /></Route>
            <Route path="/bag"><BagPage /></Route>
            <Route path="/order/:number"><OrderPlacedPage /></Route>
            <Route path="/sign-in"><SignInPage mode="sign-in" /></Route>
            <Route path="/sign-up"><SignInPage mode="sign-up" /></Route>
            <Route path="/account"><AccountPage /></Route>
            <Route path="/admin"><AdminPage /></Route>
            <Route><NotFoundPage /></Route>
          </Switch>
        </Layout>
      </BagProvider>
    </CatalogProvider>
  );
}
