// The Go service (getzure-client-service) the browser calls directly for everything that doesn't
// need better-auth's own runtime. Set NEXT_PUBLIC_CLIENT_SERVICE_URL when it isn't on localhost:8080.
const CLIENT_SERVICE_URL = process.env.NEXT_PUBLIC_CLIENT_SERVICE_URL ?? "http://localhost:8080"

type TClientServiceUrl = (path: string) => string

export const clientServiceUrl: TClientServiceUrl = (path) => `${CLIENT_SERVICE_URL}/api/v1${path}`
