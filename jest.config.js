 const Ajv = require("ajv");

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 5000000, // the more nodes involved in testing, the higher the timeout required
  verbose: true,
  roots: ['<rootDir>/test/unit'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup/ajvSetup.js'], // Setup file for AJV validation
};
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({ allErrors: true }); // Enable all error reporting
addFormats(ajv); // Add support for additional formats like email, URI, etc.

global.validateSchema = (schema, data) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    console.error("Validation errors:", validate.errors);
    throw new Error("Schema validation failed");
  }

  return true; // Return true if validation is successful
};
import { validateSchema } from "../setup/ajvSetup";

describe("AJV Schema Validation", () => {
  it("should validate data against a schema", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };

    const data = { id: 1, name: "Test" };

    // Validate data against schema
    expect(() => validateSchema(schema, data)).not.toThrow();
  });

  it("should throw an error for invalid data", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };

    const invalidData = { id: "wrong-type", name: "Test" };

    // Expect an error for invalid data
    expect(() => validateSchema(schema, invalidData)).toThrow("Schema validation failed");
  });
});
