declare global {
  interface Window {
    fbq: any
  }
}

export const trackFacebookEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      window.fbq("track", eventName, parameters)
      console.log(`[v0] ✅ Facebook event sent: ${eventName}`, parameters)
      return true
    } catch (error) {
      console.error(`[v0] ❌ Error sending Facebook event: ${eventName}`, error)
      return false
    }
  } else {
    console.log(`[v0] ❌ Facebook Pixel not available for event: ${eventName}`)
    return false
  }
}

export const trackLead = (leadData: { email?: string; phone?: string; value?: number }) => {
  console.log(`[v0] 📝 Tracking Lead event with value: R$ ${leadData.value || 0}`)

  return trackFacebookEvent("Lead", {
    content_name: "Lead Generation",
    content_category: "Sales",
    value: leadData.value || 0,
    currency: "BRL",
  })
}

export const trackPurchase = (purchaseData: { value: number; currency?: string; content_ids?: string[] }) => {
  console.log(`[v0] 🛒 Tracking Purchase event with value: R$ ${purchaseData.value}`)

  return trackFacebookEvent("Purchase", {
    value: purchaseData.value,
    currency: purchaseData.currency || "BRL",
    content_type: "product",
    content_ids: purchaseData.content_ids || [],
  })
}

export const trackCompleteRegistration = (registrationData: { email?: string; phone?: string }) => {
  return trackFacebookEvent("CompleteRegistration", {
    content_name: "Client Registration",
    status: true,
  })
}

export const trackInitiateCheckout = (checkoutData: { value?: number; currency?: string }) => {
  return trackFacebookEvent("InitiateCheckout", {
    value: checkoutData.value || 0,
    currency: checkoutData.currency || "BRL",
    content_type: "product",
  })
}

export const trackViewContent = (contentData: { content_name?: string; content_category?: string }) => {
  return trackFacebookEvent("ViewContent", {
    content_name: contentData.content_name || "Dashboard",
    content_category: contentData.content_category || "Sales",
  })
}
