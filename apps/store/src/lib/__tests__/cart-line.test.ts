import { describe, expect, it } from "vitest";
import { cartLineKey } from "@/lib/cart-line";

describe("cartLineKey", () => {
  it("con talle compone id::talle", () => {
    expect(cartLineKey({ id: "abc", size: "M" })).toBe("abc::M");
  });

  it("sin talle degrada al id (ítems legacy y productos simples)", () => {
    expect(cartLineKey({ id: "abc" })).toBe("abc");
    expect(cartLineKey({ id: "abc", size: undefined })).toBe("abc");
  });

  it("dos talles del mismo producto son líneas distintas", () => {
    expect(cartLineKey({ id: "abc", size: "S" })).not.toBe(
      cartLineKey({ id: "abc", size: "M" })
    );
  });
});
