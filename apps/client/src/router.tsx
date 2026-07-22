import { Route, Switch } from "wouter"
import { BoardPage } from "@/components/app/board-page"
import { DigestPage } from "@/components/app/digest-page"
import { HomePage } from "@/components/app/home-page"
import { SignInPage } from "@/components/login/sign-in-page"
import { routes } from "./lib/routes"

export function Router() {
  return (
    <Switch>
      <Route path={routes.about()}>About</Route>
      <Route path={routes.signIn()}>
        <SignInPage />
      </Route>
      {/* Nested, so the card panel composes onto `routes.card` — as on a deck. */}
      <Route path={routes.digest()} nest>
        <DigestPage />
      </Route>
      <Route path={routes.deck.pattern} nest>
        {(params) => <BoardPage deckId={params.id} />}
      </Route>
      <Route>
        <HomePage />
      </Route>
    </Switch>
  )
}
