import "@testing-library/react";

// Ensure a predictable test environment. Integration tests that need the
// database rely on DATABASE_URL being set by the runner (see quickstart.md).
process.env.AUTH_SECRET ??= "test-secret-not-for-production";
