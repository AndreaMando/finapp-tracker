import { redirect } from "next/navigation";

// Recurring Expenses is no longer a separate primary page — it's the second
// section of the merged Expenses page (see expenses/page.tsx). This route
// stays alive only so old bookmarks/links to /recurring still land somewhere
// useful instead of 404ing.
export default function RecurringRedirect() {
  redirect("/expenses#recurring");
}
