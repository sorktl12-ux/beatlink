// Admin account (hardcoded by requirement). Firebase Auth requires 6+ char
// passwords, so the admin signs in via an in-app check, not Firebase Auth.
export const ADMIN_ID = 'sorktl12'
export const ADMIN_PW = '4793'
// The admin also gets a real Supabase account (so it can own posts).
// The user types 4793, but we use this derived 6+ char password under the hood.
export const ADMIN_DB_PW = 'sorktl12_4793_beatlink'

// ID-based login is mapped to a synthetic email internally
export const EMAIL_DOMAIN = 'beatlink.app'
export const toEmail = (id) => `${String(id).trim().toLowerCase()}@${EMAIL_DOMAIN}`

// Supabase enforces a 6+ char password minimum that can't be lowered in the
// dashboard. To let members use short (4+) passwords, we transparently append a
// fixed suffix so the stored password is always 6+. Applied on both signup and login.
export const PW_SUFFIX = '~beatlink'
export const toDbPassword = (pw) => `${pw}${PW_SUFFIX}`

export const ROLES = [
  { id: 'player', label: 'Player', sub: 'Rappers / Vocalists', color: '#FFD700' },
  { id: 'producer', label: 'Producer', sub: 'Beatmakers', color: '#CC44FF' },
  { id: 'engineer', label: 'Engineer', sub: 'Mix / Master', color: '#00CED1' },
]

export const BOARDS = [
  { id: 'player', label: 'PLAYER', sub: 'Rappers / Vocalists', color: '#FFD700' },
  { id: 'producer', label: 'PRODUCER', sub: 'Beatmakers', color: '#CC44FF' },
  {
    id: 'engineer',
    label: 'ENGINEER',
    sub: 'Mix / Master',
    color: '#00CED1',
    // Engineers showcase a 10-second excerpt of a track they mixed/mastered.
    clipSeconds: 10,
  },
]

// Max allowed length (seconds) for an engineer showcase clip, with a little slack.
export const ENGINEER_CLIP_MAX = 12

export const DEAL_REWARD = 2 // both parties earn +2 credits on a closed deal
export const BEAT_PRICE = 10 // credits required to buy a beat

export const roleMeta = (id) => ROLES.find((r) => r.id === id) || ROLES[0]
