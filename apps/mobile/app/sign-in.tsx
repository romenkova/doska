import { useSession } from "@doska/core"
import { ScrollView } from "react-native"
import { SignedIn } from "@/components/sign-in/signed-in"
import { SyncSetup } from "@/components/sign-in/sync-setup"

export default function SignInScreen() {
  const { data: session } = useSession()

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4"
      keyboardShouldPersistTaps="handled"
    >
      {session?.authed ? <SignedIn login={session.login} /> : <SyncSetup />}
    </ScrollView>
  )
}
