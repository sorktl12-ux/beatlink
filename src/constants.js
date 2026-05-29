// Admin account (hardcoded). Members type a short password; Supabase stores a suffixed version.
export const ADMIN_ID = 'sorktl12'
export const ADMIN_PW = '4793'
export const ADMIN_DB_PW = 'sorktl12_4793_beatlink'

export const EMAIL_DOMAIN = 'beatlink.app'
export const toEmail = (id) => `${String(id).trim().toLowerCase()}@${EMAIL_DOMAIN}`

export const PW_SUFFIX = '~beatlink'
export const toDbPassword = (pw) => `${pw}${PW_SUFFIX}`

export const BOARDS = [
  { id: 'player', label: 'PLAYER', roleLabel: 'Player', sub: 'Rappers / Vocalists', color: '#FFD700' },
  { id: 'producer', label: 'PRODUCER', roleLabel: 'Producer', sub: 'Beatmakers', color: '#CC44FF' },
  {
    id: 'engineer',
    label: 'ENGINEER',
    roleLabel: 'Engineer',
    sub: 'Mix / Master',
    color: '#00CED1',
    clipSeconds: 10,
  },
]

export const ROLES = BOARDS.map(({ id, roleLabel, sub, color }) => ({
  id,
  label: roleLabel,
  sub,
  color,
}))

export const POST_STATUS = {
  approved: { label: 'Open', cls: 'text-emerald' },
  completed: { label: 'Closed', cls: 'text-muted' },
  pending: { label: 'Pending', cls: 'text-orange' },
  rejected: { label: 'Rejected', cls: 'text-crimson' },
}

export const DEAL_REWARD = 2
export const BEAT_PRICE = 10
export const PAGE_SIZE = 15
export const RECRUIT_BOARDS = ['player', 'producer']
export const RECRUIT_MIN = 1
export const RECRUIT_MAX = 20

export const roleMeta = (id) => ROLES.find((r) => r.id === id) || ROLES[0]
export const boardMeta = (id) => BOARDS.find((b) => b.id === id) || BOARDS[0]
