import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StackedAnswerList from "@/app/components/StackedAnswerList";

const OPTIONS = [
  {
    value: "a",
    label:
      "We have documented policies and train staff, but enforcement is inconsistent.",
  },
  {
    value: "b",
    label:
      "Policies exist on paper; most day-to-day decisions are made ad hoc.",
  },
  {
    value: "c",
    label: "We have not formalized security practices yet.",
  },
] as const;

function SecurityPosture({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("a");
  return (
    <StackedAnswerList
      legend="How would you describe your security posture?"
      name="securityPosture"
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("StackedAnswerList", () => {
  it("groups the options under the legend", () => {
    render(<SecurityPosture />);

    expect(
      screen.getByRole("group", {
        name: "How would you describe your security posture?",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByText(/enforcement is inconsistent/)).toBeInTheDocument();
  });

  it("checks the current value", () => {
    render(<SecurityPosture />);

    expect(
      screen.getByRole("radio", {
        name: /We have documented policies and train staff/,
      }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", {
        name: /Policies exist on paper/,
      }),
    ).not.toBeChecked();
  });

  it("reports the selected value", () => {
    const onChange = jest.fn();
    render(<SecurityPosture onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Policies exist on paper/ }),
    );
    expect(onChange).toHaveBeenLastCalledWith("b");
    expect(
      screen.getByRole("radio", { name: /Policies exist on paper/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", {
        name: /We have documented policies and train staff/,
      }),
    ).not.toBeChecked();

    fireEvent.click(
      screen.getByRole("radio", {
        name: /We have not formalized security practices/,
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith("c");
    expect(
      screen.getByRole("radio", {
        name: /We have not formalized security practices/,
      }),
    ).toBeChecked();
  });

  it("takes its name from a heading when given labelledBy", () => {
    render(
      <>
        <h1 id="posture-heading">How is security handled?</h1>
        <StackedAnswerList
          labelledBy="posture-heading"
          name="posture"
          options={OPTIONS}
          value=""
          onChange={() => {}}
        />
      </>,
    );

    expect(
      screen.getByRole("group", { name: "How is security handled?" }),
    ).toBeInTheDocument();
    // The question shows once, as the heading, not again as a legend
    expect(screen.getAllByText("How is security handled?")).toHaveLength(1);
  });

  it("shows an option's detail line under its label", () => {
    render(
      <StackedAnswerList
        legend="How big is your business?"
        name="size"
        options={[
          { value: "solo", label: "Solopreneur", detail: "Just me" },
          { value: "team", label: "Small team" },
        ]}
        value="solo"
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByRole("radio", { name: "Solopreneur Just me" }),
    ).toBeChecked();
    expect(screen.getByRole("radio", { name: "Small team" })).not.toBeChecked();
  });
});
