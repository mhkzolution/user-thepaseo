'use client'

import { useEffect } from "react"

export default function MobileSuccess() {

  useEffect(() => {

    window.location.href = "user.thepaseo://login"

  }, [])

  return <p>Logging in...</p>
}