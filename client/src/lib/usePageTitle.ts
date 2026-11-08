import { useEffect } from "react";

/** Sets the browser tab title for the current page. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | Living Foods Lahore` : "Living Foods | Dairy, frozen foods, ready meals and desserts in Lahore";
  }, [title]);
}
