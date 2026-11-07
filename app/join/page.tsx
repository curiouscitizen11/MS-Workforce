import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function PublicJoinRedirect({ searchParams }: { searchParams: { invite?: string | string[] } }) {
  const query = await Promise.resolve(searchParams)
  const raw = query.invite
  const invite = Array.isArray(raw) ? raw[0] : raw
  const suffix = invite ? "?invite=" + encodeURIComponent(invite) : ""
  redirect("/portal/join" + suffix)
}
