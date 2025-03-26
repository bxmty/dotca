// This file adds TypeScript type declarations for Jest

import 'jest';

declare global {
  const jest: typeof import('jest');
  
  // Add types for expect, describe, it, etc. that are normally provided by @types/jest
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect<T = unknown>(value: T): jest.Matchers<T>;
  function beforeAll(fn: () => void): void;
  function afterAll(fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
}