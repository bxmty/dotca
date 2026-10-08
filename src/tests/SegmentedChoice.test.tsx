import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SegmentedChoice from "@/app/components/SegmentedChoice";

const OPTIONS = [
  { value: "monthly", label: "Monthly", detail: "$99.00 / user" },
  { value: "annual", label: "Annual", detail: "save 10%" },
] as const;

function BillingCycle({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("monthly");
  return (
    <SegmentedChoice
      legend="Billing cycle"
      name="billingCycle"
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("SegmentedChoice", () => {
  it("groups the options under the legend", () => {
    render(<BillingCycle />);

    expect(
      screen.getByRole("group", { name: "Billing cycle" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByText("save 10%")).toBeInTheDocument();
  });

  it("checks the current value", () => {
    render(<BillingCycle />);

    expect(screen.getByRole("radio", { name: /^Monthly/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^Annual/ })).not.toBeChecked();
  });

  it("toggles the value", () => {
    const onChange = jest.fn();
    render(<BillingCycle onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: /^Annual/ }));
    expect(onChange).toHaveBeenLastCalledWith("annual");
    expect(screen.getByRole("radio", { name: /^Annual/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^Monthly/ })).not.toBeChecked();

    fireEvent.click(screen.getByRole("radio", { name: /^Monthly/ }));
    expect(onChange).toHaveBeenLastCalledWith("monthly");
    expect(screen.getByRole("radio", { name: /^Monthly/ })).toBeChecked();
  });
});
