// Admin account (hardcoded). Members type a short password; Supabase stores a suffixed version.
export const ADMIN_ID = 'sorktl12'
export const ADMIN_PW = '4793'
export const ADMIN_DB_PW = 'sorktl12_4793_beatlink'

export const EMAIL_DOMAIN = 'beatlink.app'
export const toEmail = (id) => `${String(id).trim().toLowerCase()}@${EMAIL_DOMAIN}`

export const PW_SUFFIX = '~beatlink'
export const toDbPassword = (pw) => `${pw}${PW_SUFFIX}`

export const BOARDS = [
  {
    id: 'player',
    label: 'PLAYER',
    roleLabel: 'Player',
    sub: 'Rappers & Vocalists',
    tagline: 'Recruit features, trade verses, and build your roster.',
    color: '#FFD700',
  },
  {
    id: 'producer',
    label: 'PRODUCER',
    roleLabel: 'Producer',
    sub: 'Beatmakers & Composers',
    tagline: 'Drop beats, set your squad size, and find the right voice.',
    color: '#CC44FF',
  },
  {
    id: 'engineer',
    label: 'ENGINEER',
    roleLabel: 'Engineer',
    sub: 'Mix & Master Engineers',
    tagline: 'Quote your rate, define your mix scope, and showcase your sound.',
    color: '#00CED1',
    clipSeconds: 10,
  },
]

export const MARKET_COLOR = '#2ECC71'

export const ROLES = BOARDS.map(({ id, roleLabel, sub, color }) => ({
  id,
  label: roleLabel,
  sub,
  color,
}))

export const POST_STATUS = {
  approved: { label: 'Active', cls: 'text-emerald' },
  completed: { label: 'Closed', cls: 'text-muted' },
  pending: { label: 'Pending', cls: 'text-orange' },
  rejected: { label: 'Rejected', cls: 'text-crimson' },
}

export const PAGE_SIZE = 15
export const RECRUIT_BOARDS = ['player', 'producer']
export const RECRUIT_MIN = 1
export const RECRUIT_MAX = 20

export const ENGINEER_MIX_SCOPES = [
  { id: 'acapella', label: 'Acapella Mix Only' },
  { id: 'full_beat', label: 'Full Mix — All Instruments & Vocals' },
]

export const ENGINEER_PAY_MIN = 1000
export const ENGINEER_PAY_MAX = 1_000_000

export const roleMeta = (id) => ROLES.find((r) => r.id === id) || ROLES[0]
export const boardMeta = (id) => BOARDS.find((b) => b.id === id) || BOARDS[0]
export const engineerMixScopeMeta = (id) =>
  ENGINEER_MIX_SCOPES.find((s) => s.id === id) || null
