"use client"

import CookieConsent from "react-cookie-consent"
import Link from "next/link"

export function CookieConsentBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Essential Only"
      enableDeclineButton
      cookieName="chameleon-cookie-consent"
      style={{
        background: "rgba(0, 0, 0, 0.98)", // GPU-OPTIMIZED: Increased opacity, removed blur
        padding: "20px",
        alignItems: "center",
        gap: "16px",
      }}
      buttonStyle={{
        background: "linear-gradient(to right, #22c55e, #3b82f6, #a855f7)",
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
        borderRadius: "8px",
        padding: "10px 24px",
        border: "none",
        cursor: "pointer",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
        borderRadius: "8px",
        padding: "10px 24px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        cursor: "pointer",
      }}
      expires={365}
      overlay={false}
      containerClasses="cookie-consent-container"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
        <span className="text-2xl">🍪</span>
        <div className="flex-1">
          <p className="text-sm md:text-base text-white font-medium mb-1">
            We use cookies to enhance your experience
          </p>
          <p className="text-xs md:text-sm text-gray-300">
            We use essential cookies for authentication and functional cookies to remember your preferences.{" "}
            <Link href="/cookies" className="underline hover:text-white transition-colors">
              Learn more
            </Link>
          </p>
        </div>
      </div>
    </CookieConsent>
  )
}
