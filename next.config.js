/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // a stray lockfile above the project makes Next mis-infer the workspace root
  outputFileTracingRoot: import.meta.dirname,
  // native module — must not be bundled (lucia tutorial requirement)
  serverExternalPackages: ["@node-rs/argon2"],
};

export default config;
