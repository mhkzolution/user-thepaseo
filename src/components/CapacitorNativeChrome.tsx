'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

const STATUS_BAR_BG = '#000000'

/**
 * ปิดการให้ Status Bar ทับเนื้อหา WebView (ค่าเริ่มต้นของ Capacitor มักเป็น overlay)
 * — แก้กรณีโหลดจาก remote URL ที่ยังไม่มี viewport-fit=cover หรือ env(safe-area-*) ได้ 0
 * Android 15+: API นี้อาจไม่พร้อมใช้งาน — พึ่ง WindowInsets/CSS แทน
 */
export default function CapacitorNativeChrome() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const apply = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false })
        await StatusBar.setBackgroundColor({ color: STATUS_BAR_BG })
        await StatusBar.setStyle({ style: Style.Dark })  // Dark = ไอคอนสีขาว (สำหรับพื้นหลังเข้ม)
      } catch (e) {
        console.warn('[CapacitorNativeChrome]', e)
      }
    }

    void apply()
  }, [])

  return null
}
