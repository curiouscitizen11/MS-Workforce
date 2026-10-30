import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PublicJoinRedirect({ searchParams }: { searchParams: { invite?: string | string[] } }) {
  const raw = searchParams.invite
  const invite = Array.isArray(raw) ? raw[0] : raw
  const query = invite ? "?invite=" + encodeURIComponent(invite) : ""
  redirect("/portal/join" + query)
}
