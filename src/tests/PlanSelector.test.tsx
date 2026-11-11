import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlanSelector from "@/app/checkout/PlanSelector";

let mockPlanParam: string | null = null;
const mockSearchParams = { get: () => mockPlanParam };
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// PlanSelector turns the `?plan=` deep link into a plan from the catalog.
describe("PlanSelector Component", () => {
  const mockOnPlanSelected = jest.fn();

  function renderWithPlanParam(planParam: string | null) {
    mockPlanParam = planParam;
    render(<PlanSelector onPlanSelected={mockOnPlanSelected} />);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports no plan when the URL names none", () => {
    renderWithPlanParam(null);

    expect(mockOnPlanSelected).toHaveBeenCalledWith(null);
  });

  it("reports no plan when the plan parameter is empty", () => {
    renderWithPlanParam("");

    expect(mockOnPlanSelected).toHaveBeenCalledWith(null);
  });

  it("selects the catalog plan named in the URL", () => {
    renderWithPlanParam("Basic");

    expect(mockOnPlanSelected).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Basic", price: "$99.00" }),
    );
  });

  it("reports no plan when the name is not in the catalog", () => {
    renderWithPlanParam("nonexistent");

    expect(mockOnPlanSelected).toHaveBeenCalledWith(null);
  });

  it("matches the plan name case-insensitively", () => {
    renderWithPlanParam("PREMIUM");

    expect(mockOnPlanSelected).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Premium" }),
    );
  });
});
