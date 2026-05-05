import { useEffect, useState } from 'react';
import { User, MessageSquare, Image, Box, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../store/index.js';
import { logout } from '../services/firebase.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => { api.get('/user/profile').then(d => setProfile(d)).catch(() => {}); }, []);

  if (!profile) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={18} className="animate-spin text-sand-400" />
    </div>
  );

  const stats = [
    { icon: MessageSquare, label: 'Chat Sessions', value: profile.stats.chats },
    { icon: Image, label: 'Images Generated', value: profile.stats.images },
    { icon: Box, label: 'Blender Scripts', value: profile.stats.scripts },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-base font-semibold text-gray-900 mb-6">Profile</h1>

      <div className="card p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-clay/10 flex items-center justify-center text-clay text-xl font-semibold flex-shrink-0">
          {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.displayName || profile.user.name || 'User'}</p>
          <p className="text-sm text-sand-400">{user?.email}</p>
          <span className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-clay/10 text-clay capitalize">
            {profile.user.plan} plan
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card px-4 py-4 text-center">
            <Icon size={16} className="text-clay mx-auto mb-2" />
            <p className="text-xl font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-sand-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Usage</h2>
        {[
          { label: 'Messages sent', value: profile.user.usage?.messages || 0 },
          { label: 'Images generated', value: profile.user.usage?.images || 0 },
          { label: 'Scripts generated', value: profile.user.usage?.scripts || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
            <span className="text-sm text-gray-600">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      <button onClick={logout} className="btn-outline mt-4 text-sm text-red-500 border-red-200 hover:bg-red-50">
        Sign out
      </button>
    </div>
  );
}
