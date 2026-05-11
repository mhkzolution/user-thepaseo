'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { App } from "@capacitor/app"
import { registerPlugin } from "@capacitor/core"
import { useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"

type BrowserPlugin = {
  close(): Promise<void>;
};

const Browser = registerPlugin<BrowserPlugin>("Browser");

export default function DeepLinkHandler() {
  const router = useRouter()
  const { refreshUser } = useContext(AuthContext)

  useEffect(() => {
    const listener = App.addListener("appUrlOpen", async (event) => {
      const url = new URL(event.url)
      const token = url.searchParams.get("token")

      if (token) {
        localStorage.setItem("token", token)
        await refreshUser()
        try {
          await Browser.close()
        } catch {
          // Browser may already be closed depending on platform behavior.
        }
        router.replace("/")
      }
    })

    return () => {
      void listener.then((l) => l.remove())
    }
  }, [refreshUser, router])

  return null
}