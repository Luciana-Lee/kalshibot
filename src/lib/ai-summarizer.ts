const SYSTEM_PROMPT = `You are a financial analyst assistant for Valor Advisors, a private investment office serving UHNW Latin American families. You summarize financial charts for weekly client presentations.`

const USER_PROMPT = (label: string) =>
  `This is a financial chart titled "${label}" from Valor Advisors weekly market review. Write exactly 3 concise bullet points (each under 18 words) summarizing the key investment takeaways. Format: one bullet per line, starting with a bullet symbol. Be specific with numbers when visible.`

export async function summarizeSlide(
  imageDataUrl: string,
  slideLabel: string,
  apiKey: string,
): Promise<string[]> {
  const base64 = imageDataUrl.split(',')[1]
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
          { type: 'text', text: USER_PROMPT(slideLabel) },
        ],
      }],
    }),
  })
  if (!response.ok) throw new Error(`Claude API error ${response.status}`)
  const data = await response.json()
  const text: string = data.content[0].text
  const bullets = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.startsWith('\u2022')).map((l: string) => l.replace(/^\u2022\s*/, '').trim())
  return bullets.length > 0 ? bullets : [text.trim()]
}
