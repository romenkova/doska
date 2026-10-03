import { useRef } from "react"
import { UserAvatar } from "@/components/accounts/user-avatar"

interface IProps {
  login: string | null
  image: string | null
  disabled: boolean
  onPick: (file: File) => void
}

export function AvatarPicker({ login, image, disabled, onPick }: IProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) onPick(file)
        }}
      />
      <button
        type="button"
        aria-label="Change avatar"
        disabled={disabled}
        className="cursor-pointer rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
      >
        <UserAvatar
          name={login}
          image={image}
          className="size-12 rounded-full"
          fallbackClassName="rounded-full text-base"
        />
      </button>
    </>
  )
}
