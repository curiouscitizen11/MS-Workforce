"use client"

import { TickIcon, fieldClass } from "@/components/portal/ui"
import { OTHER_ROLE, ROLE_GROUPS, ROLES, needsRoleLicence } from "@/lib/portal/types"

const KNOWN = new Set<string>(ROLES)

export function RolePicker({
  roles,
  onChange,
  roleLicence,
  onRoleLicence,
}: {
  roles: string[]
  onChange: (roles: string[]) => void
  roleLicence: string
  onRoleLicence: (value: string) => void
}) {
  const legacy = roles.filter((role) => !KNOWN.has(role))

  function toggle(role: string) {
    const next = roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role]
    onChange(next)
    if (!needsRoleLicence(next)) onRoleLicence("")
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold">Roles you want</legend>
      {ROLE_GROUPS.map((group) => (
        <div key={group.heading} className="portal-role-group">
          <p className="portal-role-heading">{group.heading}</p>
          <div className="flex flex-wrap gap-2">
            {group.roles.map((role) => {
              const on = roles.includes(role)
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={on}
                  className={"portal-role portal-role-tight" + (on ? " portal-role-on" : "")}
                  onClick={() => toggle(role)}
                >
                  {on ? <TickIcon /> : null}
                  {role}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div className="portal-role-group">
        <div className="flex flex-wrap gap-2">
          <RoleChip role={OTHER_ROLE} on={roles.includes(OTHER_ROLE)} onToggle={toggle} />
          {legacy.map((role) => (
            <span key={role} className="portal-role portal-role-tight">
              {role}
            </span>
          ))}
        </div>
      </div>
      {needsRoleLicence(roles) ? (
        <label className="mt-3 block text-sm font-semibold" htmlFor="role-licence">
          Licence or ticket held (e.g. HR, VOC)
          <input
            id="role-licence"
            className={fieldClass}
            value={roleLicence}
            maxLength={80}
            onChange={(event) => onRoleLicence(event.target.value)}
          />
        </label>
      ) : null}
    </fieldset>
  )
}

function RoleChip({ role, on, onToggle }: { role: string; on: boolean; onToggle: (role: string) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={"portal-role portal-role-tight" + (on ? " portal-role-on" : "")}
      onClick={() => onToggle(role)}
    >
      {on ? <TickIcon /> : null}
      {role}
    </button>
  )
}
