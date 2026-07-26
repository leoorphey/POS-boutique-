import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendingUp } from "lucide-react";
import { StatCard } from "@/features/dashboard/StatCard";

describe("StatCard", () => {
  it("affiche le label et la valeur fournis", () => {
    render(<StatCard label="Chiffre d'affaires" value="500 000 FCFA" icon={TrendingUp} />);

    expect(screen.getByText("Chiffre d'affaires")).toBeInTheDocument();
    expect(screen.getByText("500 000 FCFA")).toBeInTheDocument();
  });
});
