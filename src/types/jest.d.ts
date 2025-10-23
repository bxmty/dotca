// This file adds TypeScript type declarations for Jest
/// <reference types="jest" />

// Define common utility types to avoid using 'any'
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

type AnyFunction = (...args: unknown[]) => unknown;
type ConstructorFunction = new (...args: unknown[]) => unknown;
type MockableFunction = (...args: unknown[]) => unknown;

// We need to explicitly declare the test functions and matchers in the global scope
declare global {
  // Jest testing functions
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function expect<T>(actual: T): jest.Matchers<T>;
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;

  // Extend Jest namespace with missing functions
  namespace jest {
    function fn<T extends MockableFunction>(
      implementation?: T
    ): jest.Mock<ReturnType<T>, Parameters<T>>;

    function clearAllMocks(): void;
    function mock(
      moduleName: string,
      factory?: unknown,
      options?: unknown
    ): typeof jest;
    function requireMock(moduleName: string): unknown;

    // Define the Mock interface with all needed methods
    interface Mock<TReturn = unknown, TArgs extends unknown[] = unknown[]> {
      (...args: TArgs): TReturn;
      mockImplementation(fn: (...args: TArgs) => TReturn): this;
      mockImplementationOnce(fn: (...args: TArgs) => TReturn): this;
      mockReturnValue(value: TReturn): this;
      mockReturnValueOnce(value: TReturn): this;
      mockResolvedValue<U = TReturn>(value: U): this;
      mockResolvedValueOnce<U = TReturn>(value: U): this;
      mockRejectedValue(value: unknown): this;
      mockRejectedValueOnce(value: unknown): this;
      mockReset(): this;
      mockClear(): this;
      mock: {
        calls: TArgs[];
        results: Array<{ value: TReturn; type: 'return' | 'throw' }>;
        instances: unknown[];
        contexts: unknown[];
        lastCall: TArgs;
      };
      getMockName(): string;
    }

    // Extend matchers - R represents the return type
    interface Matchers<R> {
      toBeNull(): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBe(expected: unknown): R;
      toEqual(expected: unknown): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(count: number): R;
      toHaveBeenCalledWith(...args: unknown[]): R;
      toHaveBeenLastCalledWith(...args: unknown[]): R;
      toHaveProperty(propertyPath: string, value?: unknown): R;
      toBeGreaterThan(num: number): R;
      toBeGreaterThanOrEqual(num: number): R;
      toBeLessThan(num: number): R;
      toBeLessThanOrEqual(num: number): R;
      toMatch(expected: string | RegExp): R;
      toMatchObject(expected: Record<string, unknown>): R;
      toContain(item: unknown): R;
      toContainEqual(item: unknown): R;
      toHaveLength(length: number): R;
    }

    interface Expect {
      any(constructor: ConstructorFunction): unknown;
      anything(): unknown;
      stringContaining(expected: string): unknown;
      objectContaining(expected: Record<string, unknown>): unknown;
      arrayContaining(expected: unknown[]): unknown;
    }
  }
}
