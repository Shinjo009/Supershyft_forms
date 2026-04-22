import { Calendar, ChevronDown, Mail, Mars, Phone, User, Venus } from 'lucide-react'
import type { FormData } from '../types'

type Props = {
  member: FormData
  expanded: boolean
  onToggle: () => void
}

/** Collapsible summary card shown at the top of the Personal step for already-saved members. */
export function SavedMemberCard({ member, expanded, onToggle }: Props) {
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Member'
  const GenderIcon = member.gender === 'female' ? Venus : Mars

  return (
    <div className="w-full overflow-hidden rounded-[12px] border border-[#4b8d83]/25 bg-[linear-gradient(180deg,rgba(28,73,61,0.35)_0%,rgba(28,73,61,0.12)_100%)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/5">
          <User className="size-5 text-white/80" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold leading-tight text-white">
            {fullName}
          </div>
          <div className="text-[12px] font-medium leading-tight text-[#90df9e]">
            Personal Information Saved
          </div>
        </div>
        <span
          className={[
            'flex size-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-transform',
            expanded ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden
        >
          <ChevronDown className="size-5" strokeWidth={2} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-5 pb-5 pt-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] text-[#cccccc]/80 sm:grid-cols-3 sm:gap-x-10">
            <DetailItem Icon={User} label={fullName} />
            <DetailItem
              Icon={GenderIcon}
              label={
                member.gender
                  ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1)
                  : '—'
              }
            />
            <DetailItem Icon={Phone} label={member.phone || '—'} />
            <DetailItem Icon={Calendar} label={member.age ? `${member.age} Years` : '—'} />
            <div className="col-span-2 sm:col-span-1">
              <DetailItem Icon={Mail} label={member.email || '—'} />
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

function DetailItem({ Icon, label }: { Icon: typeof User; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </div>
  )
}
