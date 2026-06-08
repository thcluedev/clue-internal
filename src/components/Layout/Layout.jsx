import { Sidebar } from '../Sidebar/Sidebar'

export function Layout({ children }) {
  return (
    <div
      id="app-layout"
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        padding: '16px',
        gap: '14px',
      }}
    >
      <Sidebar />
      <main
        id="main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </main>
    </div>
  )
}
