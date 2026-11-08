// Runtime configuration, read at use time so tests can stub process.env.
export const ENV = {
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  /** Signs session cookies. Required: the server refuses to issue sessions without it. */
  get jwtSecret() { return process.env.JWT_SECRET ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  /** Where photos uploaded through the admin portal are stored on disk. */
  get uploadDir() { return process.env.UPLOAD_DIR ?? "uploads"; },
};
