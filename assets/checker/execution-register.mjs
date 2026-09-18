export const REGISTER_START = '<!-- execution-register:start -->'
export const REGISTER_END = '<!-- execution-register:end -->'

const ID = /^[A-Z][A-Z0-9-]+$/
const STATES = new Set(['DONE', 'NOW', 'QUEUED', 'OPEN', 'DEFERRED'])

function codeValue(cell) {
  return /^`([^`]+)`$/.exec(cell)?.[1] ?? null
}

function cells(line) {
  if (!line.startsWith('|') || !line.endsWith('|')) return []
  return line.slice(1, -1).split('|').map((cell) => cell.trim())
}

function isDivider(row) {
  return row.length > 0 && row.every((cell) => /^:?-{3,}:?$/.test(cell))
}

export function checkExecutionRegisterText(text, source = 'execution plan') {
  const findings = []
  const start = text.indexOf(REGISTER_START)
  const end = text.indexOf(REGISTER_END)
  if (start === -1 || end === -1 || end <= start) {
    return [`${source} has no single bounded execution register`]
  }
  if (text.indexOf(REGISTER_START, start + REGISTER_START.length) !== -1) {
    findings.push(`${source} has more than one execution register start`)
  }
  if (text.indexOf(REGISTER_END, end + REGISTER_END.length) !== -1) {
    findings.push(`${source} has more than one execution register end`)
  }

  const register = text.slice(start + REGISTER_START.length, end)
  const pointer = register.match(/`NOW`: `([A-Z][A-Z0-9-]+)`/)
  if (!pointer) findings.push(`${source} has no stable NOW pointer`)

  const ordered = []
  const unordered = []
  for (const line of register.split('\n')) {
    const row = cells(line)
    if (row.length === 0 || isDivider(row)) continue
    const order = /^\d+$/.test(row[0]) ? Number(row[0]) : null
    const id = codeValue(row[order === null ? 0 : 1])
    const state = codeValue(row[order === null ? 1 : 2])
    if (!id || !state || !STATES.has(state)) continue
    const parsed = order === null
      ? { id, state, work: row[2], evidence: row[3] }
      : { order, id, state, work: row[3], evidence: row[4] }
    if (!ID.test(id)) findings.push(`${source} has invalid execution ID ${id}`)
    if (!parsed.work) findings.push(`${source} task ${id} has no work boundary`)
    if (!parsed.evidence) findings.push(`${source} task ${id} has no evidence, source, owner, or trigger`)
    if (order === null) unordered.push(parsed)
    else ordered.push(parsed)
  }

  if (ordered.length === 0) {
    findings.push(`${source} has no ordered execution rows`)
    return findings
  }

  const all = [...ordered, ...unordered]
  const ids = new Set()
  for (const row of all) {
    if (ids.has(row.id)) findings.push(`${source} repeats execution ID ${row.id}`)
    ids.add(row.id)
  }

  for (const row of ordered) {
    if (!['DONE', 'NOW', 'QUEUED'].includes(row.state)) {
      findings.push(`${source} ordered task ${row.id} cannot have state ${row.state}`)
    }
    if (row.state === 'DONE' && !/\b20\d{2}-\d{2}-\d{2}\b/.test(row.evidence)) {
      findings.push(`${source} completed task ${row.id} has no completion date`)
    }
  }
  for (const row of unordered) {
    if (!['OPEN', 'DEFERRED'].includes(row.state)) {
      findings.push(`${source} unordered task ${row.id} cannot have state ${row.state}`)
    }
  }

  const nowRows = all.filter((row) => row.state === 'NOW')
  if (nowRows.length !== 1) {
    findings.push(`${source} must have exactly one NOW row; found ${nowRows.length}`)
  } else if (pointer && pointer[1] !== nowRows[0].id) {
    findings.push(`${source} NOW pointer names ${pointer[1]} but the NOW row is ${nowRows[0].id}`)
  }

  ordered.forEach((row, index) => {
    if (row.order !== index + 1) {
      findings.push(`${source} ordered row ${row.id} is ${row.order}; expected ${index + 1}`)
    }
  })
  const firstIncomplete = ordered.find((row) => row.state !== 'DONE')
  if (firstIncomplete && firstIncomplete.state !== 'NOW') {
    findings.push(`${source} first incomplete task ${firstIncomplete.id} is ${firstIncomplete.state}, not NOW`)
  }
  const firstIncompleteIndex = ordered.findIndex((row) => row.state !== 'DONE')
  for (const row of ordered.slice(firstIncompleteIndex + 1)) {
    if (row.state !== 'QUEUED') {
      findings.push(`${source} task ${row.id} follows NOW but is ${row.state}, not QUEUED`)
    }
  }

  return findings
}
