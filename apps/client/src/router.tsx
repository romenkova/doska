import { Route, Switch } from "wouter"
import { routes } from "./lib/routes"
import App from "./App"

export function Router() {
  return (
    <Switch>
      <Route path={routes.about()}>About</Route>
      <Route path={routes.deck.pattern} nest>
        {(params) => <App deckId={params.id} />}
      </Route>
      <Route>
        <App />
      </Route>
    </Switch>
  )
}
