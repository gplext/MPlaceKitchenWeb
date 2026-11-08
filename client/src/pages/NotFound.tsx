import { Link } from "wouter";
import { usePageTitle } from "@/lib/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Page not found");
  return (
    <section className="page-message container">
      <span className="eyebrow">404</span>
      <h1>This dish isn't on the menu.</h1>
      <p>The page you are looking for has moved or never existed.</p>
      <Link href="/menu" className="btn btn-primary">Back to the menu</Link>
    </section>
  );
}
