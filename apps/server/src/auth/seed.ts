import { getDB } from "../db/get-db"
import { user } from "../db/schema"
import { auth } from "."

/**
 * A self-hosted deploy configures its one account with AUTH_LOGIN/AUTH_PASSWORD,
 * and has since before there was a user table. This turns that env pair into a
 * real better-auth user on first boot, going through the sign-up API so the
 * password is hashed by whatever better-auth expects today rather than by us.
 *
 * Runs on every boot and does nothing once an account exists: the credentials in
 * the env are the *seed*, not the source of truth, so rotating AUTH_PASSWORD on
 * an existing install does not silently reset the account.
 */
export async function seedAccount(): Promise<void> {
  const login = process.env.AUTH_LOGIN ?? ""
  const password = process.env.AUTH_PASSWORD ?? ""
  if (!login || !password) {
    throw new Error("Auth misconfigured: set AUTH_LOGIN and AUTH_PASSWORD.")
  }

  const existing = await getDB().select({ id: user.id }).from(user).limit(1)
  if (existing.length > 0) return

  await auth.api.signUpEmail({
    body: {
      name: login,
      // better-auth keys users by email, but a login isn't one (e2e signs in as
      // "e2e"). Nothing ever sends mail here, so a synthetic address off a
      // reserved TLD satisfies the schema without pretending to be deliverable.
      email: `${encodeURIComponent(login)}@deck.invalid`,
      password,
      username: login,
    },
  })
}
