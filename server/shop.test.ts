import { describe, expect, it } from "vitest";
import { buildOrderMessage, deliveryFeeFor, isPriceOnRequest, priceFor, selectionKey, startingPrice, toWhatsAppDigits, whatsAppLink } from "../shared/shop";

describe("toWhatsAppDigits", () => {
  it("turns local and international formats into wa.me digits", () => {
    expect(toWhatsAppDigits("0345 9024745")).toBe("923459024745");
    expect(toWhatsAppDigits("+92 345-9024745")).toBe("923459024745");
    expect(toWhatsAppDigits("00923459024745")).toBe("923459024745");
    expect(toWhatsAppDigits("923459024745")).toBe("923459024745");
  });
});

describe("deliveryFeeFor", () => {
  it("charges the fee below the threshold and nothing at or above it", () => {
    expect(deliveryFeeFor(1000, 200, 3000)).toBe(200);
    expect(deliveryFeeFor(3000, 200, 3000)).toBe(0);
  });
  it("never makes delivery free automatically when the threshold is 0", () => {
    expect(deliveryFeeFor(50000, 200, 0)).toBe(200);
  });
  it("charges nothing for an empty bag", () => {
    expect(deliveryFeeFor(0, 200, 0)).toBe(0);
  });
});

describe("buildOrderMessage", () => {
  const message = buildOrderMessage({
    orderNumber: "LF-1001",
    items: [{ name: "Biryani", quantity: 2, lineTotal: 1300 }],
    packingName: "Insulated bag with ice packs",
    packingPrice: 100,
    deliveryFee: 0,
    total: 1400,
    customerName: "Ayesha Khan",
    phone: "0300 1234567",
    address: "House 12, Street 4",
    area: "Gulberg",
    notes: null,
  });
  it("lists the order number, items, packing, total and contact details", () => {
    expect(message).toContain("order LF-1001");
    expect(message).toContain("2 x Biryani - PKR 1,300");
    expect(message).toContain("Packing: Insulated bag with ice packs (+PKR 100)");
    expect(message).toContain("Delivery: to be confirmed");
    expect(message).toContain("Total: PKR 1,400");
    expect(message).toContain("Address: House 12, Street 4, Gulberg");
    expect(message).not.toContain("Notes:");
  });
  it("produces a wa.me link with the message encoded", () => {
    const link = whatsAppLink("0345 9024745", message);
    expect(link.startsWith("https://wa.me/923459024745?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe(message);
  });
});

describe("priceFor", () => {
  const shake = {
    price: 150,
    sizes: [{ label: "Regular", price: 150 }, { label: "Large", price: 220 }],
    choices: { label: "Flavour", options: ["Mango", "Chocolate"] },
    addons: [{ name: "Whipped cream", price: 50 }],
  };
  it("uses the size price, then adds add-ons, and describes the choice", () => {
    expect(priceFor(shake, { size: "Large", choice: "Mango", addons: ["Whipped cream"] })).toEqual({ unitPrice: 270, details: "Large · Mango · + Whipped cream" });
  });
  it("refuses a missing size or flavour and unknown add-ons", () => {
    expect(() => priceFor(shake, { choice: "Mango" })).toThrow("size");
    expect(() => priceFor(shake, { size: "Large" })).toThrow("flavour");
    expect(() => priceFor(shake, { size: "Large", choice: "Mango", addons: ["Gold leaf"] })).toThrow("add-on");
  });
  it("keeps the base price for a plain item and treats 0 as price on request", () => {
    expect(priceFor({ price: 120, sizes: null, choices: null, addons: null })).toEqual({ unitPrice: 120, details: "" });
    expect(isPriceOnRequest({ price: 0, sizes: null })).toBe(true);
    expect(startingPrice(shake)).toBe(150);
  });
  it("gives the same bag key whatever order add-ons were picked in", () => {
    expect(selectionKey(1, { addons: ["b", "a"] })).toBe(selectionKey(1, { addons: ["a", "b"] }));
  });
});

describe("order message with choices", () => {
  it("shows chosen options and flags counter-priced items", () => {
    const message = buildOrderMessage({
      orderNumber: "MP-1002",
      items: [{ name: "Shake It", quantity: 1, lineTotal: 270, details: "Large · Mango" }, { name: "Dahi Bhalla", quantity: 2, lineTotal: 0, priceOnRequest: true }],
      packingName: "Standard box", packingPrice: 0, deliveryFee: 0, total: 270,
      customerName: "Ali", phone: "0300 1234567", address: "12 Mall Road", area: "Mall Road", notes: null,
    });
    expect(message).toContain("Assalam-o-Alaikum MPlace!");
    expect(message).toContain("1 x Shake It (Large · Mango) - PKR 270");
    expect(message).toContain("2 x Dahi Bhalla - price to confirm");
    expect(message).toContain("Total: PKR 270 + items priced on confirmation");
  });
});
