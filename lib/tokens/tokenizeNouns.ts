import nlp from 'compromise'
import { MASS_NOUNS } from './massNouns'

export type ReplacementKind = 'noun' | 'article'

export type NounReplacement = {
  start: number
  end: number
  original: string
  replacement: string
  kind: ReplacementKind
}

export type TokenizeResult = {
  text: string
  replacements: NounReplacement[]
}

type Offset = {
  start: number
  length: number
}

type TermJson = {
  text: string
  tags?: string[]
  offset?: Offset
}

type MatchJson = {
  terms?: TermJson[]
}

type Candidate = {
  start: number
  end: number
  tags: string[]
}

let lexiconReady = false

function ensureLexicon() {
  if (lexiconReady) return
  const words: Record<string, string> = {}
  for (const word of MASS_NOUNS) {
    words[word] = 'Uncountable'
  }
  nlp.addWords(words)
  lexiconReady = true
}

function tagList(tags: TermJson['tags']): string[] {
  if (!tags) return []
  return Array.isArray(tags) ? tags : [...tags]
}

function hasTag(tags: string[], tag: string): boolean {
  return tags.includes(tag)
}

function contentTerms(terms: TermJson[] | undefined): TermJson[] {
  if (!terms) return []
  return terms.filter(
    (term) => term.text.length > 0 && term.offset && term.offset.length > 0,
  )
}

function termEnd(term: TermJson): number {
  return (term.offset?.start ?? 0) + (term.offset?.length ?? 0)
}

const POSSESSIVE_AFTER = /^['’]s?(?=$|[\s.,;:!?…)\]}"'”'])/i

function extendPossessive(source: string, end: number): number {
  const match = source.slice(end).match(POSSESSIVE_AFTER)
  return match ? end + match[0].length : end
}

function stripPossessive(word: string): { stem: string; possessive: string } {
  const match = word.match(/^(.*?)(['’]s|['’])$/i)
  if (match) {
    return { stem: match[1], possessive: match[2] }
  }
  return { stem: word, possessive: '' }
}

function isAllCaps(word: string): boolean {
  const letters = word.replace(/[^A-Za-z]/g, '')
  return letters.length > 0 && letters === letters.toUpperCase()
}

function applyCase(token: string, originalStem: string): string {
  if (isAllCaps(originalStem)) {
    return token.toUpperCase()
  }
  const first = originalStem.charAt(0)
  if (first && first !== first.toLowerCase()) {
    return token.charAt(0).toUpperCase() + token.slice(1)
  }
  return token
}

function isPluralNoun(stem: string, tags: string[]): boolean {
  if (hasTag(tags, 'Plural') || hasTag(tags, 'Uncountable')) {
    return true
  }
  const lower = stem.toLowerCase()
  if (MASS_NOUNS.has(lower)) {
    return true
  }
  if (hasTag(tags, 'Singular')) {
    return false
  }
  if (/ies$/i.test(stem)) return true
  if (/(ches|shes|xes|zes|ses)$/i.test(stem)) return true
  if (/s$/i.test(stem) && !/(ss|us|is|as|os)$/i.test(lower)) return true
  return false
}

export function tokenForNoun(original: string, tags: string[]): string {
  const { stem, possessive } = stripPossessive(original)
  const plural = isPluralNoun(stem, tags)
  const cased = applyCase(plural ? 'tokens' : 'token', stem)
  if (!possessive) {
    return cased
  }
  const apos = possessive.includes('’') ? '’' : "'"
  if (plural) {
    return `${cased}${apos}`
  }
  const suffixS = isAllCaps(stem) ? 'S' : 's'
  return `${cased}${apos}${suffixS}`
}

type JsonableMatch = {
  json: (opts: {
    offset: boolean
    terms: { text: boolean; tags: boolean; offset: boolean }
  }) => MatchJson[]
}

function spansFromView(
  view: { forEach: (fn: (match: JsonableMatch) => void) => unknown },
  source: string,
): Candidate[] {
  const spans: Candidate[] = []
  view.forEach((match) => {
    const json = match.json({
      offset: true,
      terms: { text: true, tags: true, offset: true },
    })
    const phrase = json[0]
    const terms = contentTerms(phrase?.terms).filter(
      (term) => !hasTag(tagList(term.tags), 'Pronoun'),
    )
    if (terms.length === 0) return
    const start = terms[0].offset!.start
    let end = termEnd(terms[terms.length - 1])
    end = extendPossessive(source, end)
    const original = source.slice(start, end)
    if (!/[A-Za-z]/.test(original)) return
    spans.push({
      start,
      end,
      tags: terms.flatMap((term) => tagList(term.tags)),
    })
  })
  return spans
}

function overlaps(a: Candidate, b: Candidate): boolean {
  return a.start < b.end && b.start < a.end
}

function collectNounSpans(source: string): Candidate[] {
  ensureLexicon()
  const doc = nlp(source)
  doc.compute('offset')

  const proper = spansFromView(doc.match('#ProperNoun+'), source)
  const nouns = spansFromView(doc.match('#Noun').not('#Pronoun'), source)

  const chosen: Candidate[] = [...proper]
  for (const span of nouns) {
    if (chosen.some((existing) => overlaps(existing, span))) continue
    chosen.push(span)
  }

  chosen.sort((a, b) => a.start - b.start)
  return chosen
}

function articleFix(
  source: string,
  start: number,
  replacement: string,
): NounReplacement | null {
  const stem = replacement.replace(/['’]s?$/i, '')
  if (!/^token$/i.test(stem)) return null
  const before = source.slice(0, start)
  const match = before.match(/(an)(\s+)$/i)
  if (!match) return null
  const article = match[1]
  const articleStart = start - article.length - match[2].length
  let fixed = 'a'
  if (article === 'AN') fixed = 'A'
  else if (article[0] === 'A') fixed = 'A'
  return {
    start: articleStart,
    end: articleStart + article.length,
    original: article,
    replacement: fixed,
    kind: 'article',
  }
}

function applyReplacements(source: string, replacements: NounReplacement[]): string {
  const ordered = [...replacements].sort((a, b) => a.start - b.start)
  let cursor = 0
  let output = ''
  for (const item of ordered) {
    output += source.slice(cursor, item.start)
    output += item.replacement
    cursor = item.end
  }
  output += source.slice(cursor)
  return output
}

export function tokenizeNouns(source: string): TokenizeResult {
  if (!source) {
    return { text: '', replacements: [] }
  }

  const spans = collectNounSpans(source)
  const replacements: NounReplacement[] = []

  for (const span of spans) {
    const original = source.slice(span.start, span.end)
    const replacement = tokenForNoun(original, span.tags)
    if (replacement === original) continue
    const article = articleFix(source, span.start, replacement)
    if (article) {
      replacements.push(article)
    }
    replacements.push({
      start: span.start,
      end: span.end,
      original,
      replacement,
      kind: 'noun',
    })
  }

  replacements.sort((a, b) => a.start - b.start)

  return {
    text: applyReplacements(source, replacements),
    replacements,
  }
}
