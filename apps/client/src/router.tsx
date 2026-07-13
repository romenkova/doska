import { Route, Switch } from "wouter"
import { SignInPage } from "@/components/login/sign-in-page"
import { routes } from "./lib/routes"
import App from "./App"

export function Router() {
  return (
    <Switch>
      <Route path={routes.about()}>About</Route>
      <Route path={routes.signIn()}>
        <SignInPage />
      </Route>
      <Route path={routes.deck.pattern} nest>
        {(params) => <App deckId={params.id} />}
      </Route>
      <Route>
        <App />
      </Route>
    </Switch>
  )
}
