import { Show, SignIn, UserButton } from '@clerk/electron/react'

export default function App() {
  return (
    <>
      <header>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <main>
        <Show when="signed-out">
          <SignIn />
        </Show>
        <Show when="signed-in">
          <h1>Clerk + Electron</h1>
        </Show>
      </main>
    </>
  )
}
