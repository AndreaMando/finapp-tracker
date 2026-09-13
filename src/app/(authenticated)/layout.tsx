import { Navbar } from "@/app/(authenticated)/components/layout/Sidebar";

// NOTE: this is a NESTED layout for the (authenticated) route group. It must
// NOT render <html>/<body> or re-wrap children in AuthProvider/I18nProvider/
// SpeedInsights/Analytics — the root layout (src/app/layout.tsx) already does
// that for every route, this one included. The previous version duplicated
// all of that here, producing invalid nested <html>/<body> tags and mounting
// every provider (and both analytics beacons) twice on every authenticated page.
export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // flex + h-screen makes <main> a genuinely bounded, internally-scrolling
    // element. Without a flex column ancestor with a real height, `flex-1`
    // on <main> does nothing — its height just becomes "however tall the
    // content is", so it never actually overflows and `overflow-auto` never
    // engages; the page then scrolls via <body> instead. That mismatch is
    // what broke mouse-wheel scrolling app-wide after the redesign:
    // `overscroll-behavior-y: contain` on an element that ISN'T the real
    // scroll container stops the wheel's scroll chain from reaching the
    // ancestor that actually is (the manually-draggable OS scrollbar still
    // worked because it scrolls the document directly, bypassing the wheel
    // event entirely).
    <div className="flex flex-col h-screen">
      <Navbar />
      {/* make the scrollable area contain its overscroll behaviour so mobile browsers (especially iPad Safari) don't allow you to 'pull' past the end of the content and see whitespace.
          pb-16 reserves space for the fixed mobile bottom nav (see Sidebar.tsx) so it never covers the last bit of page content; md:pb-0 drops that once the bottom nav itself is hidden. */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-16 md:pb-0">{children}</main>
    </div>
  );
}
