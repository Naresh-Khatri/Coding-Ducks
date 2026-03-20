import type { FunctionSignature } from "@acme/db/schema";

export interface TestData {
  index: number;
  args: string[];
  expected: string;
  isPublic: boolean;
  paramTypes: string[];
  returnType: string;
}

export interface DriverGenerator {
  lang: string;
  generate(
    userCode: string,
    fnName: string,
    testData: TestData[],
    params: FunctionSignature["params"],
    returnType: string,
  ): string;
}
