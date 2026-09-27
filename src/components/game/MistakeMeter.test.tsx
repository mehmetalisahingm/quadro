// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MistakeMeter } from "./MistakeMeter";

describe("MistakeMeter admin modu", () => {
  it("sınırsız modda sonsuz hak gösterir", () => {
    render(<MistakeMeter remaining={4} total={4} unlimited />);
    expect(screen.getByText("∞")).toBeTruthy();
    expect(screen.getByText("Admin modu: hata hakkı sınırsız")).toBeTruthy();
  });
});
