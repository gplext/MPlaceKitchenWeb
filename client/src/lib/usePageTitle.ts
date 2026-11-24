import { useEffect } from "react";

/** Sets the browser tab title for the current page. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | MPlace Lahore` : "MPlace by Living Foods | Chacha's chai, meals and dairy on Mall Road, Lahore";
  }, [title]);
}
