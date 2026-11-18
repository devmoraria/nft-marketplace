import { Link } from '@tanstack/react-router'
import { useLogout } from './api'
import { useSession } from './session'

/** Para o header: mostra "Entrar" sem sessão, ou o nome e "Sair" com sessão. */
export function UserMenu({ className = '' }: { className?: string }) {
  const session = useSession()
  const logout = useLogout()

  if (!session) {
    return (
      <Link to="/login" className={`text-sm font-semibold text-[#e89b55] hover:underline ${className}`}>
        Entrar
      </Link>
    )
  }
  return (
    <span className={`flex items-center gap-3 text-sm ${className}`}>
      <span data-testid="user-name" className="max-w-[140px] truncate text-[#f3ece3]">{session.user.name}</span>
      <button type="button" onClick={() => void logout()} className="font-semibold text-[#e89b55] hover:underline">
        Sair
      </button>
    </span>
  )
}
