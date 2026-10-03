import { initials } from "@doska/core"
import { Avatar, AvatarFallback, AvatarImage } from "@doska/ui-kit"
import { UserRound } from "lucide-react"
import { useAvatarUrl } from "@/lib/hooks"

interface IProps {
  name: string | null
  image: string | null
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  name,
  image,
  className,
  fallbackClassName,
}: IProps) {
  const src = useAvatarUrl(image)

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className={fallbackClassName}>
        {name ? initials(name) : <UserRound className="size-1/2" />}
      </AvatarFallback>
    </Avatar>
  )
}
