import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";
import type { AddressSuggestion } from "@/lib/nominatim";

function buildSuggestion(
  overrides: Partial<AddressSuggestion> = {},
): AddressSuggestion {
  return {
    id: "1",
    displayName: "123 Main St, Toronto, Ontario, Canada",
    addressLine: "123 Main St",
    city: "Toronto",
    state: "Ontario",
    postalCode: "M5V 2T6",
    country: "Canada",
    countryCode: "CA",
    lat: 43.6532,
    lon: -79.3832,
    ...overrides,
  };
}

function mockFetchResults(results: AddressSuggestion[]) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ results }),
  });
}

function Wrapper({
  onSelectAddress,
}: {
  onSelectAddress: (s: AddressSuggestion) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div>
      <label htmlFor="address">Address</label>
      <AddressAutocomplete
        id="address"
        name="address"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        onSelectAddress={onSelectAddress}
      />
    </div>
  );
}

async function typeAndDebounce(value: string) {
  fireEvent.change(screen.getByLabelText("Address"), {
    target: { value },
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
}

describe("AddressAutocomplete", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("associates the input with its external label via id/name", () => {
    render(<Wrapper onSelectAddress={jest.fn()} />);

    const input = screen.getByLabelText("Address") as HTMLInputElement;
    expect(input).toHaveAttribute("id", "address");
    expect(input).toHaveAttribute("name", "address");
  });

  it("does not fetch for queries under 3 characters", async () => {
    render(<Wrapper onSelectAddress={jest.fn()} />);

    await typeAndDebounce("to");

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("debounces before fetching for a query of 3+ characters", async () => {
    mockFetchResults([buildSuggestion()]);
    render(<Wrapper onSelectAddress={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Address"), {
      target: { value: "123 Main" },
    });
    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      "/api/geocode?q=123+Main",
    );
  });

  it("collapses rapid changes within the debounce window into a single fetch", async () => {
    mockFetchResults([buildSuggestion()]);
    render(<Wrapper onSelectAddress={jest.fn()} />);

    const input = screen.getByLabelText("Address");
    fireEvent.change(input, { target: { value: "123 M" } });
    fireEvent.change(input, { target: { value: "123 Ma" } });
    fireEvent.change(input, { target: { value: "123 Main" } });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("123+Main");
  });

  it("renders suggestions with OpenStreetMap attribution", async () => {
    mockFetchResults([buildSuggestion()]);
    render(<Wrapper onSelectAddress={jest.fn()} />);

    await typeAndDebounce("123 Main St");

    expect(
      screen.getByText("123 Main St, Toronto, Ontario, Canada"),
    ).toBeInTheDocument();
    expect(screen.getByText("OpenStreetMap")).toBeInTheDocument();
  });

  it("selecting a suggestion calls onSelectAddress and closes the dropdown", async () => {
    const onSelectAddress = jest.fn();
    const suggestion = buildSuggestion();
    mockFetchResults([suggestion]);
    render(<Wrapper onSelectAddress={onSelectAddress} />);

    await typeAndDebounce("123 Main St");

    fireEvent.click(screen.getByText(suggestion.displayName));

    expect(onSelectAddress).toHaveBeenCalledWith(suggestion);
    expect(screen.queryByText(suggestion.displayName)).not.toBeInTheDocument();
  });

  it("does not close the dropdown on mousedown before the click registers", async () => {
    mockFetchResults([buildSuggestion()]);
    render(<Wrapper onSelectAddress={jest.fn()} />);

    await typeAndDebounce("123 Main St");

    fireEvent.mouseDown(screen.getByText("123 Main St, Toronto, Ontario, Canada"));

    expect(
      screen.getByText("123 Main St, Toronto, Ontario, Canada"),
    ).toBeInTheDocument();
  });

  it("supports keyboard navigation and selection", async () => {
    const onSelectAddress = jest.fn();
    const first = buildSuggestion({ id: "1", displayName: "First result" });
    const second = buildSuggestion({ id: "2", displayName: "Second result" });
    mockFetchResults([first, second]);
    render(<Wrapper onSelectAddress={onSelectAddress} />);

    await typeAndDebounce("123 Main St");

    const input = screen.getByLabelText("Address");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelectAddress).toHaveBeenCalledWith(second);
  });

  it("closes without selecting on Escape", async () => {
    mockFetchResults([buildSuggestion()]);
    render(<Wrapper onSelectAddress={jest.fn()} />);

    await typeAndDebounce("123 Main St");

    fireEvent.keyDown(screen.getByLabelText("Address"), { key: "Escape" });

    expect(
      screen.queryByText("123 Main St, Toronto, Ontario, Canada"),
    ).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", async () => {
    mockFetchResults([buildSuggestion()]);
    render(
      <div>
        <Wrapper onSelectAddress={jest.fn()} />
        <button type="button">outside</button>
      </div>,
    );

    await typeAndDebounce("123 Main St");

    fireEvent.mouseDown(screen.getByText("outside"));

    expect(
      screen.queryByText("123 Main St, Toronto, Ontario, Canada"),
    ).not.toBeInTheDocument();
  });

  it("handles a response with no results key gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    render(<Wrapper onSelectAddress={jest.fn()} />);

    await typeAndDebounce("123 Main St");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("handles a rejected fetch gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));
    render(<Wrapper onSelectAddress={jest.fn()} />);

    await typeAndDebounce("123 Main St");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not fetch after unmounting mid-debounce", async () => {
    mockFetchResults([buildSuggestion()]);
    const { unmount } = render(<Wrapper onSelectAddress={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Address"), {
      target: { value: "123 Main St" },
    });

    unmount();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not throw when unmounted while a fetch is in flight", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const { unmount } = render(<Wrapper onSelectAddress={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Address"), {
      target: { value: "123 Main St" },
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();

    expect(() => {
      resolveFetch({ ok: true, json: () => Promise.resolve({ results: [] }) });
    }).not.toThrow();
  });
});
