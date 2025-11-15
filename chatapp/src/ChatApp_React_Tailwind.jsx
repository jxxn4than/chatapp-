/*
ChatApp_React_Tailwind.jsx
Single-file React component (default export) for a modern chat app UI.
This is the full component used in the project.
*/
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Search, Send, Moon, Sun, Paperclip, Smile } from 'lucide-react';

const uid = (n = 8) => Math.random().toString(36).slice(2, 2 + n);
const nowISO = () => new Date().toISOString();
const timeShort = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const SAMPLE_CONTACTS = [
  { id: 'c1', name: 'Alicia', avatarColor: 'bg-pink-400', online: true, last: 'Hola!' },
  { id: 'c2', name: 'Bruno', avatarColor: 'bg-indigo-400', online: false, last: 'Veo esto luego' },
  { id: 'c3', name: 'Carla', avatarColor: 'bg-green-400', online: true, last: 'OK' },
];

const LS_KEY = 'chatapp_messages_v1';
const LS_CONTACTS = 'chatapp_contacts_v1';
const LS_THEME = 'chatapp_theme_v1';

export default function ChatApp({ serverUrl = null, user = { id: 'me', name: 'Tú' } }) {
  const [dark, setDark] = useState(() => {
    const v = localStorage.getItem(LS_THEME);
    return v ? v === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    localStorage.setItem(LS_THEME, dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const [contacts, setContacts] = useState(() => {
    const stored = localStorage.getItem(LS_CONTACTS);
    return stored ? JSON.parse(stored) : SAMPLE_CONTACTS;
  });
  useEffect(() => localStorage.setItem(LS_CONTACTS, JSON.stringify(contacts)), [contacts]);

  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : { c1: [ { id: uid(), from: 'c1', text: 'Bienvenido!', time: nowISO() } ] };
  });
  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(messages)), [messages]);

  const [activeContact, setActiveContact] = useState(contacts[0]?.id || null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState({});
  const [socket, setSocket] = useState(null);
  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!serverUrl) return;
    const s = io(serverUrl, { autoConnect: false });
    s.connect();
    setSocket(s);

    s.on('connect', () => {
      console.log('socket connected', s.id);
      s.emit('identify', user);
    });

    s.on('message', msg => {
      setMessages(prev => {
        const copy = { ...prev };
        const partner = msg.from === user.id ? msg.to : msg.from;
        copy[partner] = [...(copy[partner] || []), msg];
        return copy;
      });
    });

    s.on('typing', ({ from, isTyping }) => {
      setTyping(t => ({ ...t, [from]: isTyping }));
    });

    return () => s.disconnect();
  }, [serverUrl]);

  function sendMessage({ to, text, file = null }) {
    const message = { id: uid(), from: user.id, to, text, fileName: file?.name || null, time: nowISO() };
    setMessages(prev => {
      const copy = { ...prev };
      copy[to] = [...(copy[to] || []), message];
      return copy;
    });
    if (socket && socket.connected) socket.emit('message', message);
  }

  function mockReply(to) {
    setTimeout(() => {
      const reply = { id: uid(), from: to, to: user.id, text: 'Respuesta automática ✨', time: nowISO() };
      setMessages(prev => {
        const copy = { ...prev };
        copy[to] = [...(copy[to] || []), reply];
        return copy;
      });
    }, 900 + Math.random() * 1200);
  }

  function handleSend(e) {
    e?.preventDefault?.();
    if (!input.trim()) return;
    if (!activeContact) return;
    sendMessage({ to: activeContact, text: input.trim() });
    setInput('');
    if (!serverUrl) mockReply(activeContact);
  }

  function handleAttach(files) {
    if (!files || files.length === 0 || !activeContact) return;
    const f = files[0];
    sendMessage({ to: activeContact, text: `[Archivo: ${f.name}]`, file: f });
  }

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, activeContact]);

  useEffect(() => {
    const id = setInterval(() => {
      setContacts(prev => prev.map(c => ({ ...c, online: Math.random() > 0.5 })));
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const visibleContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <aside className="w-80 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Chat</h2>
          <button onClick={() => setDark(d => !d)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Toggle theme">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contactos" className="w-full pl-9 pr-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <div className="absolute left-2 top-2 text-gray-400"><Search size={16} /></div>
          </div>
          <button onClick={() => { const id = uid(); const name = `Nuevo ${contacts.length + 1}`; const newC = { id, name, avatarColor: 'bg-rose-400', online: true, last: '' }; setContacts(c => [newC, ...c]); setActiveContact(id); }} className="px-3 py-2 rounded-md bg-indigo-600 text-white">Nuevo</button>
        </div>

        <div className="flex-1 overflow-auto">
          {visibleContacts.map(c => (
            <div key={c.id} onClick={() => setActiveContact(c.id)} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${activeContact === c.id ? 'bg-gray-200 dark:bg-gray-800' : ''}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${c.avatarColor}`}>{c.name[0]}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.online ? 'online' : 'offline'}</div>
                </div>
                <div className="text-sm text-gray-500 truncate">{(messages[c.id] && messages[c.id].slice(-1)[0]?.text) || c.last || 'Sin mensajes'}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 mt-3">Conectado: {serverUrl ? 'Servidor' : 'Modo local'}</div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          {activeContact ? (
            <>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white ${(contacts.find(c => c.id === activeContact)?.avatarColor) || 'bg-gray-400'}`}>{contacts.find(c => c.id === activeContact)?.name?.[0]}</div>
              <div className="flex-1">
                <div className="font-semibold">{contacts.find(c => c.id === activeContact)?.name}</div>
                <div className="text-sm text-gray-500">{contacts.find(c => c.id === activeContact)?.online ? 'En línea' : 'Últ. vez hace poco'}</div>
              </div>
            </>
          ) : (
            <div className="flex-1 text-center text-gray-500">Selecciona un contacto para chatear</div>
          )}
        </header>

        <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-4 bg-white dark:bg-gray-900">
          {activeContact && ((messages[activeContact] || []).length === 0) && (
            <div className="text-center text-gray-500 mt-8">Empieza la conversación</div>
          )}

          {activeContact && (messages[activeContact] || []).map(msg => (
            <div key={msg.id} className={`flex ${msg.from === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-xl ${msg.from === user.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900'}`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className="text-xs mt-1 text-right opacity-70">{timeShort(msg.time)}</div>
              </div>
            </div>
          ))}

          {activeContact && typing[activeContact] && (
            <div className="text-sm text-gray-500">{contacts.find(c => c.id === activeContact)?.name} está escribiendo...</div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-end gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800">
              <Paperclip size={18} />
            </button>
            <input ref={fileInputRef} onChange={e => handleAttach(e.target.files)} type="file" className="hidden" />
          </div>

          <div className="flex-1">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); } }} placeholder={activeContact ? 'Escribe un mensaje...' : 'Selecciona un chat para escribir'} disabled={!activeContact} className="w-full min-h-[44px] max-h-40 resize-none p-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => setInput(s => s + ' 😊')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800" title="Emoji"><Smile size={18} /></button>
              <button type="submit" className="p-2 rounded-md bg-indigo-600 text-white flex items-center gap-2 px-3">
                <Send size={16} /> <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>
            <div className="text-xs text-gray-500">{Object.keys(messages[activeContact] || {}).length} mensajes</div>
          </div>
        </form>
      </main>
    </div>
  );
}