import { useState } from "react"
import { SlidesModal, useIsMobile, type Slide } from "@doska/ui-kit"
import { SetupChoiceSlide, type Setup } from "./setup-choice-slide"
import { SelfhostSlide } from "./selfhost-slide"
import { CardViewSlide } from "./card-view-slide"
import { QuickNoteSlide } from "./quick-note-slide"
import { ONBOARDING_SEEN_KEY } from "./use-should-onboard"
import {
  WHATS_NEW_SEEN_KEY,
  WHATS_NEW_VERSION,
} from "../whats-new/whats-new-seen"
import { isDesktop } from "@/lib/platform"
import { webKeyValue } from "@/lib/adapters/web-kv"
import intro from "./slides/intro.md?raw"
import feedback from "./slides/feedback.md?raw"
import local from "./slides/local.md?raw"
import signedIn from "./slides/signed-in.md?raw"
import members from "./slides/members.md?raw"
import cards from "./slides/cards.md?raw"
import organize from "./slides/organize.md?raw"

interface IProps {
  shouldShow: boolean
}

export function OnboardingDeck({ shouldShow }: IProps) {
  // Only the first value counts, so signing in mid-deck doesn't close it
  const [open, setOpen] = useState(shouldShow)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const isMobile = useIsMobile()

  function close() {
    webKeyValue.set(ONBOARDING_SEEN_KEY, "1")
    webKeyValue.set(WHATS_NEW_SEEN_KEY, WHATS_NEW_VERSION)
    setOpen(false)
  }

  const signInSlide: Slide = (next) => (
    <SelfhostSlide
      onDone={() => {
        setIsSignedIn(true)
        next()
      }}
    />
  )

  const slides: Slide[] = [intro, cards]
  // Card view is ignored on mobile
  if (!isMobile) slides.push((next) => <CardViewSlide onDone={next} />)
  slides.push(organize)
  if (isDesktop()) slides.push(<QuickNoteSlide />)
  slides.push(members)
  if (isDesktop()) {
    slides.push((next) => (
      <SetupChoiceSlide
        value={setup}
        onChange={(value) => {
          setSetup(value)
          next()
        }}
      />
    ))
  }
  // The web app is always served by a self-hosted instance
  if (!isDesktop() || setup === "selfhost") {
    slides.push(signInSlide)
    if (isSignedIn) slides.push(signedIn)
  }
  if (setup === "local") slides.push(local)
  slides.push(feedback)

  return (
    <SlidesModal
      slides={slides}
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    />
  )
}
