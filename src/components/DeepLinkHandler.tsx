'use client'

import { useEffect } from "react"
import { App } from "@capacitor/app"

export default function DeepLinkHandler() {

  useEffect(() => {

    App.addListener("appUrlOpen", (event) => {

      const url = new URL(event.url)
      const token = url.searchParams.get("token")

      if (token) {

        localStorage.setItem("token", token)

        window.location.href = "/"

      }

    })

  }, [])

  return null
}