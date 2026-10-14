import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Field,
  getErrorProps,
  PhoneField,
  TextField,
} from "@/app/components/Field";

describe("TextField", () => {
  it("labels the input from above and passes input props through", () => {
    const onChange = jest.fn();
    render(
      <TextField
        id="email"
        label="Email"
        type="email"
        name="email"
        value="dana@"
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveValue("dana@");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");

    fireEvent.change(input, { target: { value: "dana@co.ca" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("ties an error, worded as the fix, to the input", () => {
    render(
      <TextField
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
        error="enter your email address"
      />,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Fix: enter your email address");
  });

  it("marks an optional field in its label", () => {
    render(
      <TextField
        id="goals"
        label="Goals"
        isOptional
        value=""
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText(/^Goals/)).toBeInTheDocument();
    expect(screen.getByText("optional")).toBeInTheDocument();
  });
});

describe("Field", () => {
  it("wraps any control, which takes the error props itself", () => {
    const error = "choose your team size";
    render(
      <Field id="size" label="Team size" error={error}>
        <select id="size" {...getErrorProps("size", error)}>
          <option value="">Select</option>
        </select>
      </Field>,
    );

    expect(screen.getByLabelText("Team size")).toHaveAccessibleDescription(
      "Fix: choose your team size",
    );
  });
});

describe("PhoneField", () => {
  it("reports the number in E.164 form and ties its error to the input", () => {
    const onChange = jest.fn();
    render(
      <PhoneField
        id="phone"
        name="phone"
        label="Phone"
        value=""
        onChange={onChange}
        error="enter a phone number we can reach you on"
      />,
    );

    const input = screen.getByLabelText("Phone");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Fix: enter a phone number we can reach you on",
    );

    fireEvent.change(input, { target: { value: "+1 289 555 0142" } });
    expect(onChange).toHaveBeenLastCalledWith("+12895550142");
  });

  it("shows a stored E.164 number", () => {
    render(
      <PhoneField
        id="phone"
        name="phone"
        label="Phone"
        value="+12895550142"
        onChange={() => {}}
      />,
    );

    expect(
      (screen.getByLabelText("Phone") as HTMLInputElement).value.replace(
        /\D/g,
        "",
      ),
    ).toBe("12895550142");
  });
});
