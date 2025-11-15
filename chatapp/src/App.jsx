import React, { useState } from 'react'
import ChatApp from './ChatApp_React_Tailwind'
import Auth from './Auth'

export default function App() {
  const [user, setUser] = useState(null)

  if (!user) return <Auth onAuth={setUser} />

  return <ChatApp user={user} />
}