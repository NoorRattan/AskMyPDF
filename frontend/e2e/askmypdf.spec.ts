import { expect, test } from "@playwright/test"

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function makePdf(lines: string[]) {
  const stream = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    ...lines.flatMap((line, index) => [`(${escapePdfText(line)}) Tj`, index < lines.length - 1 ? "0 -18 Td" : ""]),
    "ET",
  ]
    .filter(Boolean)
    .join("\n")

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ]

  let body = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body))
    body += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n`
  body += "0000000000 65535 f \n"
  body += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("")
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(body)
}

test("uploads a PDF and receives a cited backend-only answer when online keys are absent", async ({ page }) => {
  await page.goto("/#upload")

  await page.locator('input[type="file"]').setInputFiles({
    name: "askmypdf-smoke.pdf",
    mimeType: "application/pdf",
    buffer: makePdf([
      "AskMyPDF is a portfolio RAG chatbot for uploaded PDF documents.",
      "It extracts text, creates chunks, embeds them, and streams cited answers.",
      "This smoke test document verifies the upload and chat path end to end.",
    ]),
  })

  await expect(page.getByRole("textbox", { name: "Ask a question about your PDF" })).toBeVisible({ timeout: 30_000 })
  await page.getByRole("textbox", { name: "Ask a question about your PDF" }).fill("What is AskMyPDF?")
  await page.getByRole("button", { name: "Send message" }).click()

  await expect(page.getByRole("log", { name: "Chat messages" })).toContainText("From the document:", { timeout: 30_000 })
  await expect(page.getByRole("log", { name: "Chat messages" })).toContainText("Answered by the backend-only route")
  await expect(page.getByRole("log", { name: "Chat messages" })).toContainText("source")
})
