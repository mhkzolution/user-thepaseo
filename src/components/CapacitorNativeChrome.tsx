'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

const STATUS_BAR_BG = '#000000'
/** ความสูงโดยประมาณของ Android 3-button / gesture navigation bar (dp) */
const ANDROID_NAV_BAR_FALLBACK_PX = 48

function measureEnvSafeAreaBottom(): number {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;bottom:0;left:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;'
  document.body.appendChild(probe)
  const value = parseFloat(getComputedStyle(probe).paddingBottom) || 0
  probe.remove()
  return value
}

function measureVisualViewportBottomInset(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
}

function applyBottomSafeAreaInset() {
  let bottom = Math.max(measureEnvSafeAreaBottom(), measureVisualViewportBottomInset())

  if (bottom === 0 && Capacitor.getPlatform() === 'android') {
    bottom = ANDROID_NAV_BAR_FALLBACK_PX
  }

  document.documentElement.style.setProperty('--safe-area-inset-bottom', `${bottom}px`)
}

/**
 * ปิดการให้ Status Bar ทับเนื้อหา WebView (ค่าเริ่มต้นของ Capacitor มักเป็น overlay)
 * — แก้กรณีโหลดจาก remote URL ที่ยังไม่มี viewport-fit=cover หรือ env(safe-area-*) ได้ 0
 * Android 15+: API นี้อาจไม่พร้อมใช้งาน — พึ่ง WindowInsets/CSS แทน
 */
export default function CapacitorNativeChrome() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const applyStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false })
        await StatusBar.setBackgroundColor({ color: STATUS_BAR_BG })
        await StatusBar.setStyle({ style: Style.Dark })  // Dark = ไอคอนสีขาว (สำหรับพื้นหลังเข้ม)
      } catch (e) {
        console.warn('[CapacitorNativeChrome]', e)
      }
    }

    void applyStatusBar()

    applyBottomSafeAreaInset()

    const vv = window.visualViewport
    vv?.addEventListener('resize', applyBottomSafeAreaInset)
    vv?.addEventListener('scroll', applyBottomSafeAreaInset)
    window.addEventListener('orientationchange', applyBottomSafeAreaInset)
    window.addEventListener('resize', applyBottomSafeAreaInset)

    return () => {
      vv?.removeEventListener('resize', applyBottomSafeAreaInset)
      vv?.removeEventListener('scroll', applyBottomSafeAreaInset)
      window.removeEventListener('orientationchange', applyBottomSafeAreaInset)
      window.removeEventListener('resize', applyBottomSafeAreaInset)
    }
  }, [])

  return null
}
