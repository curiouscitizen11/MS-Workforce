import { redirect } from "next/navigation"

/** Old address. Pay is weekly; this sends workers to the current pay week. */
export default function FortnightRedirect() {
  redirect("/portal/week")
}
