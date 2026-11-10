import { describe, expect, it } from "vitest"
import { loginDemos } from "@/lib/portal/login-demos"
import type { Store } from "@/lib/portal/store"

describe("live login demos", () => {
  it("does not read workers or return names, emails or mobiles when the portal is live", async () => {
    let reads = 0
    const store = {
      workers: {
        all: async () => {
          reads += 1
          return [
            {
              id: "w-admin",
              role: "admin",
              name: "Office Admin",
              email: "admin@example.com",
              mobile: "+61400000001",
            },
            {
              id: "w-sam",
              role: "worker",
              name: "Sam Lee",
              email: "sam.lee@example.com",
              mobile: "+61400111222",
            },
          ]
        },
      },
    } as unknown as Store
    expect(await loginDemos(store, false)).toEqual([])
    expect(reads).toBe(0)
  })
})
