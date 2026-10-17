import Header from "@/components/Header"

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
        <Header />
      </div>
      <main className="site-chrome-main relative z-0" style={{ paddingTop: "var(--site-header-height)" }}>
        {children}
      </main>
      <div className="site-chrome-footer">{footer}</div>
      <div className="site-chrome-sticky">{sticky}</div>
    </>
  )
}
