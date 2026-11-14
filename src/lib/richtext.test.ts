import { markdownToHtml } from './richtext.ts'

const html = markdownToHtml('Hello **world**, this is *italic*, ==highlighted==, ~~strike~~, `code`, and [Link](https://example.com)')

if (!html.includes('<strong>world</strong>')) {
  throw new Error(`FAIL: expected <strong>world</strong>, got: ${html}`)
}
if (!html.includes('<em>italic</em>')) {
  throw new Error(`FAIL: expected <em>italic</em>, got: ${html}`)
}
if (!html.includes('<mark class="bg-[#ffe600]')) {
  throw new Error(`FAIL: expected <mark>, got: ${html}`)
}
if (!html.includes('<s>strike</s>')) {
  throw new Error(`FAIL: expected <s>strike</s>, got: ${html}`)
}
if (!html.includes('<code')) {
  throw new Error(`FAIL: expected <code>, got: ${html}`)
}
if (!html.includes('href="https://example.com"')) {
  throw new Error(`FAIL: expected link, got: ${html}`)
}

console.log('Rich text tests: all cases passed!')
