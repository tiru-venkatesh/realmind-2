import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Image, Box, User, Plus, Cpu, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth, useChat } from '../../store/index.js';
import { logout } from '../../services/firebase.js';
import { api } from '../../services/api.js';

const NAV = [
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/images', icon: Image, label: 'Images' },
  { to: '/blender', icon: Box, label: 'Blender' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { sessions, setSessions, setActiveChatId } = useChat();

  useEffect(() => {
    api.get('/chat').then(d => setSessions(d.sessions)).catch(() => {});
  }, []);

  const newChat = async () => {
    const { session } = await api.post('/chat/session', { type: 'primary' });
    setSessions([session, ...sessions]);
    setActiveChatId(session._id);
    nav(`/chat/${session._id}`);
  };

  const del = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    await api.delete(`/chat/${id}`);
    setSessions(sessions.filter(s => s._id !== id));
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-white border-r border-sand-200 h-full">
      <div className="px-4 h-14 flex items-center gap-2.5 border-b border-sand-200 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-clay flex items-center justify-center">
          <Cpu size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm text-gray-900">RealMind AI</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-sand-100 text-gray-900 font-medium' : 'text-sand-500 hover:bg-sand-50 hover:text-gray-700'
            }`}>
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}

        <div className="pt-4">
          <div className="flex items-center justify-between px-3 pb-1.5">
            <span className="text-xs font-semibold text-sand-400 uppercase tracking-wider">History</span>
            <button onClick={newChat} className="p-0.5 rounded hover:bg-sand-100 text-sand-400 hover:text-gray-600 transition-colors" title="New chat">
              <Plus size={13} />
            </button>
          </div>
          {sessions.slice(0, 25).map(s => (
            <NavLink key={s._id} to={`/chat/${s._id}`} className={({ isActive }) =>
              `group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                isActive ? 'bg-sand-100 text-gray-800' : 'text-sand-400 hover:bg-sand-50 hover:text-gray-600'
              }`}>
              <MessageSquare size={11} className="flex-shrink-0" />
              <span className="truncate flex-1">{s.title}</span>
              <button onClick={e => del(e, s._id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all">
                <Trash2 size={10} />
              </button>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-sand-200 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sand-50 transition-colors group cursor-pointer" onClick={logout}>
          <div className="w-6 h-6 rounded-full bg-clay/15 flex items-center justify-center text-clay text-xs font-semibold flex-shrink-0">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-sand-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
