/** Reserved admin username — signup blocked; set role in Supabase SQL only. */
export const ADMIN_ID = 'sorktl12'

export const EMAIL_DOMAIN = 'beatlink.app'
export const toEmail = (id) => `${String(id).trim().toLowerCase()}@${EMAIL_DOMAIN}`

export const PW_SUFFIX = '~beatlink'
export const toDbPassword = (pw) => `${pw}${PW_SUFFIX}`

export const BOARDS = [
  { id: 'player', color: '#FFD700' },
  { id: 'producer', color: '#CC44FF' },
  { id: 'engineer', color: '#00CED1', clipSeconds: 10 },
]

export const MARKET_COLOR = '#2ECC71'
export const SHOW505_COLOR = '#FF6B35'

export const POST_STATUS = {
  approved: { cls: 'text-emerald' },
  completed: { cls: 'text-muted' },
  pending: { cls: 'text-orange' },
  rejected: { cls: 'text-crimson' },
}

export const PAGE_SIZE = 15
export const RECRUIT_BOARDS = ['player', 'producer']
export const RECRUIT_MIN = 1
export const RECRUIT_MAX = 20

export const ENGINEER_MIX_SCOPE_IDS = ['acapella', 'full_beat']

export const ENGINEER_PAY_MIN = 1000
export const ENGINEER_PAY_MAX = 1_000_000

export const boardMeta = (id) => BOARDS.find((b) => b.id === id) || BOARDS[0]
