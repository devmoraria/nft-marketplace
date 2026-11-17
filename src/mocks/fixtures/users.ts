// Senhas só existem como hash SHA-256 (hex). Credenciais fictícias de demonstração:
//   ana@example.com   / Senha@123
//   bruno@example.com / Senha@456
export interface UserRecord { id: string; name: string; email: string; avatarUrl?: string; passwordHash: string }

export function buildUsers(): UserRecord[] {
  return [
    { id: 'user-ana', name: 'Ana Souza', email: 'ana@example.com', passwordHash: 'a2ca37fe6fdc490b8f7ce841e1701a169d2b1697c6b5b5c63f94abb8f9b6d6dd' },
    { id: 'user-bruno', name: 'Bruno Lima', email: 'bruno@example.com', passwordHash: '9875d879e70abde04d1959fb9d3450837bbd78217423bc11734574413532ada8' },
  ]
}
