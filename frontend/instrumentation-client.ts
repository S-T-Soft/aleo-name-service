import posthog from "posthog-js"

const apiHost = process.env.NODE_ENV === "production" ? "/ingest" : "https://us.i.posthog.com";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: apiHost,
  ui_host: "https://us.posthog.com",
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});
