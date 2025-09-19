"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"

interface FacebookPixelProps {
  pixelId: string
}

declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (typeof window !== "undefined" && pixelId && !initialized.current && !window.fbq) {
      console.log("[v0] Facebook Pixel initialized:", pixelId)
      initialized.current = true

      // Initialize fbq function
      window.fbq = () => {
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
      }
      if (!window._fbq) window._fbq = window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []
    }
  }, [pixelId])

  if (!pixelId || initialized.current) {
    return null
  }

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.fbq && !initialized.current) {
            window.fbq("init", pixelId)
            window.fbq("track", "PageView")
            initialized.current = true
          }
        }}
        src="https://connect.facebook.net/en_US/fbevents.js"
      />

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
