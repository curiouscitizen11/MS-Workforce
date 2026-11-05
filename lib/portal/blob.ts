import { isMock } from "@/lib/portal/config"

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN || ""
}

export function blobConfigured(): boolean {
  return !isMock() && Boolean(token())
}

export async function storePrivateBlob(id: string, bytes: Buffer, contentType: string, folder = "portal"): Promise<string | null> {
  if (!blobConfigured()) return null
  const url = new URL("https://vercel.com/api/blob")
  url.searchParams.set("pathname", folder.replace(/\/+$/, "") + "/" + id)
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      authorization: "Bearer " + token(),
      "x-api-version": "7",
      "x-content-type": contentType,
      "x-vercel-blob-access": "private",
    },
    body: new Uint8Array(bytes),
  })
  if (!response.ok) throw new Error("Private file store returned " + response.status)
  const data = (await response.json()) as { url?: string }
  if (!data.url) throw new Error("Private file store did not return a file address.")
  return data.url
}

export async function readPrivateBlob(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: token() ? { authorization: "Bearer " + token() } : {},
  })
  if (!response.ok) throw new Error("Private file store returned " + response.status)
  return new Uint8Array(await response.arrayBuffer())
}

export async function deletePrivateBlob(url: string) {
  if (!url || !token() || isMock()) return
  await fetch("https://vercel.com/api/blob/delete", {
    method: "POST",
    headers: {
      authorization: "Bearer " + token(),
      "x-api-version": "7",
      "content-type": "application/json",
    },
    body: JSON.stringify({ urls: [url] }),
  }).catch(() => undefined)
}
