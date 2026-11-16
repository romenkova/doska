import { createContext, useContext } from "react"
import type { VaultState } from "@/lib/vault/use-vault"

const VaultContext = createContext<VaultState | null>(null)

export const VaultProvider = VaultContext.Provider

export function useVaultContext(): VaultState {
  const vault = useContext(VaultContext)
  if (!vault) throw new Error("useVaultContext needs a VaultProvider")
  return vault
}
