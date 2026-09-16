import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/electron/react'

export default function App() {
  return (
    <>
      <header>
        <Show when="signed-out">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <main>
        <h1>Clerk + Electron</h1>
      </main>
    </>
  )
}
