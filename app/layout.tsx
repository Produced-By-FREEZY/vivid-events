import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vivid Events | Professional Event Lighting Services in BC",
  description:
    "Transform your event with professional automated DMX lighting systems. Vivid Events provides cutting-edge lighting solutions for weddings, corporate events, concerts & festivals across British Columbia. Book your unforgettable lighting experience today!",
  keywords: [
    "vivid events",
    "event lighting",
    "DMX lighting",
    "wedding lighting",
    "corporate event lighting",
    "concert lighting",
    "professional lighting services",
    "automated lighting",
    "British Columbia",
    "BC",
    "Langley",
    "Vancouver",
    "lighting rental",
    "event production",
  ],
  authors: [{ name: "Vivid Events" }],
  creator: "Vivid Events",
  publisher: "Vivid Events",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://vividevents.ca",
    siteName: "Vivid Events",
    title: "Vivid Events | Professional Event Lighting Services",
    description:
      "Transform your event with professional automated DMX lighting systems. Cutting-edge lighting solutions for weddings, corporate events, concerts & festivals in BC.",
    images: [
      {
        url: "/images/vivid-events-logo.png",
        width: 1200,
        height: 630,
        alt: "Vivid Events - Professional Event Lighting Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vivid Events | Professional Event Lighting Services",
    description:
      "Transform your event with professional automated DMX lighting systems. Book your unforgettable lighting experience today!",
    images: ["/images/vivid-events-logo.png"],
  },
  alternates: {
    canonical: "https://vividevents.ca",
  },
  other: {
    "google-site-verification": "your-google-verification-code-here", // You'll need to add this
  },
  icons: {
    icon: "/images/vivid-events-logo.png",
    shortcut: "/images/vivid-events-logo.png",
    apple: "/images/vivid-events-logo.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/vivid-events-logo.png" />
        <link rel="shortcut icon" href="/images/vivid-events-logo.png" />
        <link rel="apple-touch-icon" href="/images/vivid-events-logo.png" />

        {/* Structured Data for Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://vividevents.ca",
              name: "Vivid Events",
              alternateName: ["Vivid Events Lighting", "VividEvents"],
              description:
                "Professional automated DMX lighting systems for weddings, corporate events, concerts and festivals. Transform your event with cutting-edge lighting technology.",
              url: "https://vividevents.ca",
              telephone: "+1-236-878-9991",
              email: "info@vividevents.ca",
              logo: "https://vividevents.ca/images/vivid-events-logo.png",
              image: "https://vividevents.ca/images/vivid-events-logo.png",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Langley",
                addressRegion: "BC",
                addressCountry: "CA",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "49.1042",
                longitude: "-122.6604",
              },
              areaServed: [
                {
                  "@type": "State",
                  name: "British Columbia",
                },
                {
                  "@type": "City",
                  name: "Vancouver",
                },
                {
                  "@type": "City",
                  name: "Langley",
                },
              ],
              serviceType: [
                "Event Lighting",
                "DMX Lighting Systems",
                "Wedding Lighting",
                "Corporate Event Lighting",
                "Concert Lighting",
                "Festival Lighting",
              ],
              priceRange: "$2500-$20000+",
              openingHours: "Mo-Su 09:00-21:00",
              sameAs: ["https://vividevents.ca"],
            }),
          }}
        />

        {/* Service Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: "Professional Event Lighting Services",
              description:
                "Automated DMX lighting systems that create synchronized light shows for unforgettable events",
              provider: {
                "@type": "LocalBusiness",
                name: "Vivid Events",
              },
              areaServed: "British Columbia, Canada",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Event Lighting Services",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Wedding Lighting",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Corporate Event Lighting",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Concert & Festival Lighting",
                    },
                  },
                ],
              },
            }),
          }}
        />

        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://vividevents.ca",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Services",
                  item: "https://vividevents.ca#services",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Contact",
                  item: "https://vividevents.ca#contact",
                },
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
