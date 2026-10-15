declare module '@playwright/test' {
  export interface Locator {
    evaluate<T>(pageFunction: (element: HTMLElement) => T | Promise<T>): Promise<T>;
    count(): Promise<number>;
    nth(index: number): Locator;
    waitFor(options?: any): Promise<void>;
    isEnabled(): Promise<boolean>;
    isEditable(): Promise<boolean>;
    [key: string]: any;
  }
  export interface Page {
    url(): string;
    locator(selector: string): Locator;
    getByTestId(testId: string): Locator;
    getByRole(role: any, options?: any): Locator;
    getByLabel(label: any, options?: any): Locator;
    getByText(text: any, options?: any): Locator;
    getByPlaceholder(text: any, options?: any): Locator;
    getByTitle(text: any, options?: any): Locator;
    getByAltText(text: any, options?: any): Locator;
    [key: string]: any;
  }
  export interface TestInfo {
    testId?: string;
    outputDir?: string;
  }
  export const test: any;
  export const expect: any;
}
