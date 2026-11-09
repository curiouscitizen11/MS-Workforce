import Header from "@/components/Header"
import { applyForWorkHref, bookLabourHref } from "@/lib/public-links"

export default function SiteChrome({
  children,
  footer,
  sticky,
}: {
  children: React.ReactNode
  footer: React.ReactNode
  sticky: React.ReactNode
}) {
  return (
    <>
      <div className="site-chrome-header">
        <Header applyHref={applyForWorkHref()} bookHref={bookLabourHref()} />
      </div>
      <main className="site-chrome-main relative z-0 pt-14">
        {children}
      </main>
      <div className="site-chrome-footer">{footer}</div>
      <div className="site-chrome-sticky">{sticky}</div>
    </>
  )
}
