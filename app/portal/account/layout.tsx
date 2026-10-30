import type { Metadata } from "next"

export const metadata: Metadata = { title: "Your login" }

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
