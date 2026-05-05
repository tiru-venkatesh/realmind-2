import { useState } from 'react';
import axios from 'axios';
import { Play, Download, Loader2, Box, Terminal, Wand2 } from 'lucide-react';
import ModelViewer from '../components/blender/ModelViewer.jsx';

export default function BlenderPage() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [renderPath, setRenderPath] = useState(null);
  const [tab, setTab] = useState('code');

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setCode('');
    setLog('');
    setRenderPath(null);
    try {
      const { data } = await axios.post('/api/blender/generate', { prompt, execute: false });
      setCode(data.code);
    } catch {
      setCode('// Error generating script');
    } finally {
      setLoading(false);
    }
  };

  const execute = async () => {
    if (!code.trim() || executing) return;
    setExecuting(true);
    setLog('Running Blender...\n');
    try {
      const { data } = await axios.post('/api/blender/execute', { code });
      setLog(data.log || 'No output');
      if (data.renderPath) setRenderPath(data.renderPath);
      setTab('log');
    } catch {
      setLog('Blender execution failed. Check BLENDER_PATH in .env');
    } finally {
      setExecuting(false);
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'realmind_script.py';
    a.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-sand-200 bg-white">
        <h1 className="font-semibold text-stone-900 text-sm">Blender Automation</h1>
        <p className="text-xs text-sand-500">Generate production-ready bpy scripts with advanced techniques</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-sand-200 bg-white">
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                placeholder="e.g. A robotic arm with hydraulics and metal materials..."
                className="flex-1 px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
              />
              <button
                onClick={generate}
                disabled={!prompt.trim() || loading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-800 disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                Generate
              </button>
            </div>
          </div>

          <div className="border-b border-sand-200 bg-white flex items-center gap-0 px-4">
            {['code', 'log'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${
                  tab === t
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-sand-500 hover:text-stone-700'
                }`}
              >
                {t === 'code' ? 'Script' : 'Logs'}
              </button>
            ))}
            {code && (
              <div className="ml-auto flex gap-2 py-2">
                <button
                  onClick={download}
                  className="flex items-center gap-1 px-3 py-1 text-xs border border-sand-200 rounded-lg text-sand-600 hover:bg-sand-50 transition-colors"
                >
                  <Download size={11} /> .py
                </button>
                <button
                  onClick={execute}
                  disabled={executing}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors"
                >
                  {executing ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                  Run in Blender
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-stone-950">
            {tab === 'code' ? (
              code ? (
                <pre className="p-5 text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">{code}</pre>
              ) : (
                <div className="flex items-center justify-center h-full text-sand-600">
                  <div className="text-center">
                    <Box size={32} className="mx-auto mb-3 opacity-20 text-white" />
                    <p className="text-xs text-sand-500">Generated script will appear here</p>
                  </div>
                </div>
              )
            ) : (
              <pre className="p-5 text-xs font-mono leading-relaxed whitespace-pre-wrap text-sand-300">
                {log || 'No logs yet'}
              </pre>
            )}
          </div>
        </div>

        <div className="w-80 border-l border-sand-200 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-sand-200">
            <p className="text-xs font-medium text-stone-700">3D Preview</p>
          </div>
          <div className="p-3">
            <div className="text-xs text-sand-400 text-center py-8">
              Run the full pipeline to see 3D preview
            </div>
          </div>

          {renderPath && (
            <div className="p-3 border-t border-sand-200">
              <p className="text-xs font-medium text-stone-700 mb-2">Render Output</p>
              <img
                src={renderPath}
                alt="Render"
                className="w-full rounded-lg border border-sand-200"
              />
              <a
                href={renderPath}
                download
                className="mt-2 flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs bg-sand-100 hover:bg-sand-200 rounded-lg text-stone-700 transition-colors"
              >
                <Download size={11} /> Download Render
              </a>
            </div>
          )}

          <div className="p-4 border-t border-sand-200 mt-auto">
            <p className="text-xs font-medium text-stone-700 mb-3">Advanced Techniques</p>
            <div className="space-y-2">
              {[
                { name: 'Geometry Nodes', desc: 'Procedural mesh' },
                { name: 'PBR Materials', desc: 'Full node setup' },
                { name: 'Camera Animation', desc: 'Orbit path' },
                { name: 'Physics', desc: 'Cloth, rigid body' },
                { name: 'Particle Systems', desc: 'Hair, debris' },
              ].map(t => (
                <div key={t.name} className="flex items-center justify-between">
                  <span className="text-xs text-stone-700">{t.name}</span>
                  <span className="text-xs text-sand-400">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
