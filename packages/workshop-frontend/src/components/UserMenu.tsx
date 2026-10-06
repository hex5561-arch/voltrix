import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { DropdownMenu } from '@cloudflare/kumo'
import { Lightning, GraduationCap } from '@phosphor-icons/react'
import { useAuthenticatedApi } from '../AuthContext'
import { useAvatar } from '../useAvatar'
import { MENU_CONTENT, MENU_ITEM, MENU_ITEM_DANGER, MENU_POSITIONER_STYLE } from './menuStyles'
import UpgradeModal from './UpgradeModal'

export default function UserMenu() {
  const { authenticatedApi, logout, currentUser, isAdmin } = useAuthenticatedApi()
  const navigate = useNavigate()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const avatarUrl = useAvatar(authenticatedApi, currentUser?.id)

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger
          render={
            <button
              className="w-7 h-7 cursor-pointer rounded-full flex items-center justify-center bg-kumo-tint hover:bg-kumo-fill transition-colors overflow-hidden"
              title="Open profile menu"
              aria-label="Open profile menu"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-kumo-strong">{initials}</span>
              )}
            </button>
          }
        />
        <DropdownMenu.Content className={MENU_CONTENT} style={MENU_POSITIONER_STYLE}>
          <DropdownMenu.Item
            onClick={() => navigate({ to: '/profile' })}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-kumo-default hover:bg-kumo-tint rounded-md cursor-pointer transition-colors w-full"
          >
            <GraduationCap size={14} weight="fill" className="text-indigo-400" />
            Academic Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => navigate({ to: '/providers' })}
            className={MENU_ITEM}
          >
            Providers
          </DropdownMenu.Item>
          {isAdmin && (
            <DropdownMenu.Item
              onClick={() => navigate({ to: '/admin' })}
              className={MENU_ITEM}
            >
              Admin
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator />
          {/* Upgrade — opens payment modal directly inside the app */}
          <DropdownMenu.Item
            onClick={() => setUpgradeOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md cursor-pointer text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors w-full"
          >
            <Lightning weight="fill" size={13} />
            Upgrade to Scholar Pro
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            variant="danger"
            onClick={logout}
            className={MENU_ITEM_DANGER}
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}
