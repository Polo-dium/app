import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Calls Claude and automatically continues if the response is truncated (stop_reason === 'max_tokens').
 * Returns the full concatenated text response.
 * @param {object} options - Same options as anthropic.messages.create()
 * @param {number} [maxLoops=3] - Safety limit on continuation attempts
 */
export async function getCompleteResponse(options, maxLoops = 3) {
  const { messages: initialMessages, ...rest } = options
  let fullResponse = ''
  let messages = [...initialMessages]
  let loopCount = 0

  while (loopCount < maxLoops) {
    const response = await anthropic.messages.create({ ...rest, messages })

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    fullResponse += text

    if (response.stop_reason === 'end_turn') break

    // stop_reason === 'max_tokens' → ask Claude to continue exactly where it stopped
    messages = [
      ...messages,
      { role: 'assistant', content: fullResponse },
      { role: 'user', content: "Continue exactement où tu t'es arrêté, sans répéter ce qui a déjà été dit." }
    ]
    loopCount++
  }

  return fullResponse
}
