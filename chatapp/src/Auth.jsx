import React, { useState } from 'react'

export default function Auth({ onAuth }) {
  const [step, setStep] = useState('choose')
  const [method, setMethod] = useState('')
  const [value, setValue] = useState('')
  const [code, setCode] = useState('')

  function sendCode() {
    if (!value.trim()) return
    setStep('code')
  }

  function verifyCode() {
    if (code === '1234') {
      onAuth({ id: value, name: value, avatar: null })
    } else {
      alert('Código incorrecto. Usa 1234 para la demo.')
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-80 text-gray-900 dark:text-gray-100">
        {step === 'choose' && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center">Iniciar sesión</h2>
            <button onClick={() => { setMethod('phone'); setStep('input'); }} className="w-full py-3 bg-black text-white rounded-xl mb-3">Usar teléfono</button>
            <button onClick={() => { setMethod('email'); setStep('input'); }} className="w-full py-3 bg-gray-200 dark:bg-gray-700 rounded-xl">Usar correo</button>
          </>
        )}

        {step === 'input' && (
          <>
            <h2 className="text-lg font-medium mb-2 text-center">
              Ingresa tu {method === 'phone' ? 'número' : 'correo'}
            </h2>
            <input
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
              value={value} onChange={e => setValue(e.target.value)}
              placeholder={method === 'phone' ? 'Ej: 5551234567' : 'correo@example.com'}
            />
            <button onClick={sendCode} className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-xl">Enviar código</button>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className="text-lg font-medium mb-2 text-center">Ingresa el código</h2>
            <p className="text-sm text-center text-gray-500 mb-2">Código demo: 1234</p>
            <input
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
              value={code} onChange={e => setCode(e.target.value)}
              placeholder="Código de 4 dígitos"
            />
            <button onClick={verifyCode} className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-xl">Continuar</button>
          </>
        )}
      </div>
    </div>
  )
}