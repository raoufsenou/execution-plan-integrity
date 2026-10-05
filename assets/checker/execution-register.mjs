export const REGISTER_START = '<!-- execution-register:start -->'
export const REGISTER_END = '<!-- execution-register:end -->'

const ID = /^[A-Z][A-Z0-9-]+$/
const RESERVED_IDS = new Set(['IDLE', 'NONE'])
export const TASK_KINDS = new Set([
  'IMPLEMENTATION',
  'MIGRATION',
  'OPERATIONS',
  'DESIGN',
  'DECISION',
  'VALIDATION',
  'DOCUMENTATION',
])
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

export function parseExecutionRegisterText(text, source = 'execution plan') {
  const findings = []
  const ordered = []
  const unordered = []
  const start = text.indexOf(REGISTER_START)
  const end = text.indexOf(REGISTER_END)
  if (start === -1 || end === -1 || end <= start) {
    return { findings: [`${source} has no single bounded execution register`], ordered, unordered, all: [], pointer: null }
  }
  if (text.indexOf(REGISTER_START, start + REGISTER_START.length) !== -1) {
    findings.push(`${source} has more than one execution register start`)
  }
  if (text.indexOf(REGISTER_END, end + REGISTER_END.length) !== -1) {
    findings.push(`${source} has more than one execution register end`)
  }

  const register = text.slice(start + REGISTER_START.length, end)
  const pointerMatches = [...register.matchAll(/^`NOW`: `(NONE|IDLE|[A-Z][A-Z0-9-]+)`\s*$/gm)]
  const pointer = pointerMatches.length === 1 ? pointerMatches[0][1] : null
  if (pointerMatches.length !== 1) {
    findings.push(`${source} must have exactly one stable NOW pointer, IDLE state, or terminal NONE state; found ${pointerMatches.length}`)
  }
  const idleReasons = [...register.matchAll(/^`IDLE REASON`:\s*(.*)$/gm)].map((match) => match[1].trim())
  const resumeConditions = [...register.matchAll(/^`RESUME WHEN`:\s*(.*)$/gm)].map((match) => match[1].trim())

  let tableMode = null
  for (const line of register.split('\n')) {
    const row = cells(line)
    if (row.length === 0) {
      tableMode = null
      continue
    }
    if (row[0] === 'Order' && row[1] === 'ID' && row[2] === 'Kind' && row[3] === 'State') {
      tableMode = 'ordered'
      continue
    }
    if (row[0] === 'ID' && row[1] === 'Kind' && row[2] === 'State') {
      tableMode = 'unordered'
      continue
    }
    if (isDivider(row)) continue
    if (!tableMode) continue
    const order = tableMode === 'ordered' && /^\d+$/.test(row[0]) ? Number(row[0]) : null
    const id = codeValue(row[tableMode === 'unordered' ? 0 : 1])
    const kind = codeValue(row[tableMode === 'unordered' ? 1 : 2])
    const state = codeValue(row[tableMode === 'unordered' ? 2 : 3])
    if (!id) continue
    if (!kind) {
      findings.push(`${source} task ${id} has no task kind`)
      continue
    }
    if (!TASK_KINDS.has(kind)) {
      findings.push(`${source} task ${id} has invalid kind ${kind}`)
      continue
    }
    if (!state) {
      findings.push(`${source} task ${id} has no state`)
      continue
    }
    if (!STATES.has(state)) {
      findings.push(`${source} task ${id} has invalid state ${state}`)
      continue
    }
    const parsed = tableMode === 'unordered'
      ? { id, kind, state, work: row[3], evidence: row[4] }
      : { order, id, kind, state, work: row[4], evidence: row[5] }
    if (!ID.test(id)) findings.push(`${source} has invalid execution ID ${id}`)
    if (RESERVED_IDS.has(id)) findings.push(`${source} uses reserved pointer state ${id} as a task ID`)
    if (!parsed.work) findings.push(`${source} task ${id} has no work boundary`)
    if (!parsed.evidence) findings.push(`${source} task ${id} has no evidence, source, owner, or trigger`)
    if (tableMode === 'unordered') unordered.push(parsed)
    else ordered.push(parsed)
  }

  if (ordered.length === 0 && pointer !== 'IDLE') {
    findings.push(`${source} has no ordered execution rows`)
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
  const placeholder = /^(?:-|n\/?a|none|tbd|todo|unknown)$/i
  if (pointer === 'IDLE') {
    if (nowRows.length !== 0) {
      findings.push(`${source} NOW pointer is IDLE but found ${nowRows.length} NOW row(s)`)
    }
    const remaining = ordered.find((row) => row.state !== 'DONE')
    if (remaining) {
      findings.push(`${source} NOW pointer is IDLE but ordered task ${remaining.id} is ${remaining.state}`)
    }
    if (unordered.length === 0) {
      findings.push(`${source} NOW pointer is IDLE but no OPEN or DEFERRED task remains`)
    }
    if (idleReasons.length !== 1) {
      findings.push(`${source} IDLE requires exactly one IDLE REASON; found ${idleReasons.length}`)
    } else if (!idleReasons[0] || placeholder.test(idleReasons[0])) {
      findings.push(`${source} IDLE REASON must describe why no task is currently executable`)
    }
    if (resumeConditions.length !== 1) {
      findings.push(`${source} IDLE requires exactly one RESUME WHEN condition; found ${resumeConditions.length}`)
    } else if (!resumeConditions[0] || placeholder.test(resumeConditions[0])) {
      findings.push(`${source} RESUME WHEN must name an observable decision, event, or dependency change`)
    }
    if (idleReasons.length === 1 && resumeConditions.length === 1 && unordered.length > 0) {
      const unresolvedIds = new Set(unordered.map((row) => row.id))
      const referencedIds = [...`${idleReasons[0]} ${resumeConditions[0]}`.matchAll(/`([A-Z][A-Z0-9-]+)`/g)]
        .map((match) => match[1])
      if (!referencedIds.some((id) => unresolvedIds.has(id))) {
        findings.push(`${source} IDLE metadata must name at least one OPEN or DEFERRED task ID`)
      }
    }
  } else if (pointer === 'NONE') {
    if (nowRows.length !== 0) {
      findings.push(`${source} NOW pointer is NONE but found ${nowRows.length} NOW row(s)`)
    }
    const remaining = ordered.find((row) => row.state !== 'DONE')
    if (remaining) {
      findings.push(`${source} NOW pointer is NONE but ordered task ${remaining.id} is ${remaining.state}`)
    }
    if (unordered.length > 0) {
      findings.push(`${source} NOW pointer is NONE but unordered task ${unordered[0].id} is ${unordered[0].state}; use IDLE`)
    }
  } else {
    if (nowRows.length !== 1) {
      findings.push(`${source} must have exactly one NOW row; found ${nowRows.length}`)
    } else if (pointer && pointer !== nowRows[0].id) {
      findings.push(`${source} NOW pointer names ${pointer} but the NOW row is ${nowRows[0].id}`)
    }
  }
  if (pointer !== 'IDLE' && (idleReasons.length > 0 || resumeConditions.length > 0)) {
    findings.push(`${source} has IDLE metadata while NOW pointer is ${pointer ?? 'invalid'}`)
  }

  ordered.forEach((row, index) => {
    if (row.order !== index + 1) {
      findings.push(`${source} ordered row ${row.id} is ${row.order}; expected ${index + 1}`)
    }
  })
  const firstIncompleteIndex = ordered.findIndex((row) => row.state !== 'DONE')
  if (firstIncompleteIndex !== -1) {
    const firstIncomplete = ordered[firstIncompleteIndex]
    if (firstIncomplete.state !== 'NOW') {
      findings.push(`${source} first incomplete task ${firstIncomplete.id} is ${firstIncomplete.state}, not NOW`)
    }
    for (const row of ordered.slice(firstIncompleteIndex + 1)) {
      if (row.state !== 'QUEUED') {
        findings.push(`${source} task ${row.id} follows NOW but is ${row.state}, not QUEUED`)
      }
    }
  }

  return { findings, ordered, unordered, all, pointer }
}

export function checkExecutionRegisterText(text, source = 'execution plan') {
  return parseExecutionRegisterText(text, source).findings
}
