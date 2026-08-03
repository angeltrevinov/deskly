/** @jest-environment node */

describe("api server runtime", () => {
  const originalFetch = global.fetch
  const originalServerApiUrl = process.env.SERVER_API_URL

  afterEach(() => {
    global.fetch = originalFetch
    process.env.SERVER_API_URL = originalServerApiUrl
    jest.resetModules()
  })

  it("uses SERVER_API_URL for server-side requests", async () => {
    process.env.SERVER_API_URL = "http://backend:8000"

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)
    global.fetch = fetchMock

    const { getTickets } = await import("@/lib/api")

    await expect(getTickets()).resolves.toEqual([])

    const [requestUrl] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(requestUrl.toString()).toBe("http://backend:8000/api/tickets")
  })
})
