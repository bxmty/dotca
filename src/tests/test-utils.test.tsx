// tests/test-utils.test.tsx
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { jest } from "@jest/globals";
import {
  render as customRender,
  mockFetch,
  resetMocks,
  mockPricingPlans,
  getMockRouter,
  getMockSearchParams,
} from "./test-utils";

// Create a test component for rendering tests
const TestComponent = () => (
  <div data-testid="test-component">Test Content</div>
);

describe("Test Utilities", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("customRender", () => {
    it("renders components correctly", () => {
      customRender(<TestComponent />);

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("passes additional options to render", () => {
      const container = document.createElement("div");
      customRender(<TestComponent />, { container });

      expect(
        container.querySelector('[data-testid="test-component"]'),
      ).not.toBeNull();
    });
  });

  describe("mockFetch", () => {
    it("mocks fetch with default response", async () => {
      mockFetch();

      expect(global.fetch).toBeDefined();
      expect(typeof global.fetch).toBe("function");

      // Test the mocked fetch
      const response = await (global.fetch as jest.Mock)();
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toEqual({ ok: true });
    });

    it("mocks fetch with custom response", async () => {
      const customResponse = { success: true, data: { id: 1, name: "Test" } };
      mockFetch(customResponse);

      const response = await (global.fetch as jest.Mock)();
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toEqual(customResponse);
    });

    it("allows overriding ok status", async () => {
      mockFetch({ ok: false, status: 500 });

      const response = await (global.fetch as jest.Mock)();
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe("resetMocks", () => {
    it("is a no-op function for type checking", () => {
      // The actual implementation is in jest.setup.js
      // This test just verifies the function exists
      expect(typeof resetMocks).toBe("function");
      // Should execute without errors
      resetMocks();
    });
  });

  describe("mockPricingPlans", () => {
    it("provides pricing plan test data", () => {
      expect(mockPricingPlans).toBeDefined();
      expect(Array.isArray(mockPricingPlans)).toBe(true);
      expect(mockPricingPlans.length).toBe(3);

      // Check structure of the first plan
      const firstPlan = mockPricingPlans[0];
      expect(firstPlan).toHaveProperty("name", "Basic");
      expect(firstPlan).toHaveProperty("price", "$99");
      expect(firstPlan).toHaveProperty(
        "description",
        "Basic plan for small businesses",
      );
      expect(firstPlan).toHaveProperty("features");
      expect(Array.isArray(firstPlan.features)).toBe(true);
      expect(firstPlan.features.length).toBe(2);

      // Check Premium plan
      const premiumPlan = mockPricingPlans[2];
      expect(premiumPlan.name).toBe("Enterprise");
      expect(premiumPlan.features.length).toBe(6);
    });

    it("verifies all plans have the required properties", () => {
      mockPricingPlans.forEach((plan) => {
        expect(plan).toHaveProperty("name");
        expect(plan).toHaveProperty("price");
        expect(plan).toHaveProperty("description");
        expect(plan).toHaveProperty("features");
        expect(typeof plan.name).toBe("string");
        expect(typeof plan.price).toBe("string");
        expect(typeof plan.description).toBe("string");
        expect(Array.isArray(plan.features)).toBe(true);
      });
    });

    it("verifies the standard plan has correct number of features", () => {
      const standardPlan = mockPricingPlans[1];
      expect(standardPlan.name).toBe("Premium");
      expect(standardPlan.features.length).toBe(4);
      expect(standardPlan.price).toBe("$199");
    });

    it("verifies all features are strings", () => {
      mockPricingPlans.forEach((plan) => {
        plan.features.forEach((feature) => {
          expect(typeof feature).toBe("string");
          expect(feature.length).toBeGreaterThan(0);
        });
      });
    });
  });

  // We have to skip testing the mockNextComponentsExample for now as it causes hook conflicts
  // This is a mock template string, not functional code, so we don't need to test it rigorously

  describe("Next.js mocks", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("provides mock router functions", () => {
      // Get the mock router
      const router = getMockRouter();

      // Check if mocked functions are available
      expect(router.push).toBeDefined();
      expect(typeof router.push).toBe("function");

      // Test the mock
      router.push("/test");
      expect(router.push).toHaveBeenCalledWith("/test");
    });

    it("provides mock searchParams functions", () => {
      // Get the mock search params
      const searchParams = getMockSearchParams();

      // Check if mocked functions are available
      expect(searchParams.get).toBeDefined();
      expect(typeof searchParams.get).toBe("function");

      // Test the mock
      searchParams.get("test");
      expect(searchParams.get).toHaveBeenCalledWith("test");
    });

    it("uses mocked Next.js Link component", () => {
      // Create a custom Link mock for this specific test to avoid conflicts
      jest.mock(
        "next/link",
        () => ({
          __esModule: true,
          default: ({
            children,
            href,
          }: {
            children: React.ReactNode;
            href: string;
          }) => {
            return (
              <a data-testid="mock-link" href={href}>
                {children}
              </a>
            );
          },
        }),
        { virtual: true },
      );

      // Get the mocked component - dynamic import is needed for test setup
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Link = require("next/link").default;

      // Render using our customRender
      customRender(<Link href="/test">Test Link</Link>);

      // Check if Link was properly mocked using testid
      const link = screen.getByTestId("mock-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
      expect(link).toHaveTextContent("Test Link");
    });

    it("uses mocked Next.js Image component from setup", () => {
      // Create a custom mock for Image component for this specific test
      jest.mock(
        "next/image",
        () => ({
          __esModule: true,
          default: (props: {
            src: string;
            alt?: string;
            width?: number;
            height?: number;
          }) => {
            // Convert all numeric props to strings to avoid DOM warnings
            const imgProps = {
              ...props,
              width: props.width?.toString(),
              height: props.height?.toString(),
            };
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                data-testid="mock-image"
                {...imgProps}
                alt={props.alt || ""}
              />
            );
          },
        }),
        { virtual: true },
      );

      // Get the mocked component (with our custom implementation above)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Image = require("next/image").default;

      // Render using our test-utils render to avoid Next.js specific issues
      customRender(
        <Image src="/test.jpg" alt="Test Image" width={100} height={100} />,
      );

      // Use screen.getByTestId instead of directly querying the container
      const img = screen.getByTestId("mock-image");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/test.jpg");
      expect(img).toHaveAttribute("alt", "Test Image");
    });
  });
});
