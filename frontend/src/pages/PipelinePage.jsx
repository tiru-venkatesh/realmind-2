import { useState } from 'react';
import axios from 'axios';
import { Zap, Loader2, CheckCircle, XCircle, Clock, Download, Box } from 'lucide-react';
import ModelViewer from '../components/blender/ModelViewer.jsx';

const STEP_LABELS = [
  { n: 1, label: 'Shap-E mesh generation', desc: 'Text → 3D geometry via diffusion model' },
  { n: 2, label: 'Blender script generation', desc: 'AI writes import + lighting + render script' },
  { n: 3, label: 'Blender execution & render', desc: 'Script runs, outputs PNG render' },
];

function StepIndicator({ step, status }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        status === 'done' ? 'bg-emerald-100 text-emerald-700' :
        status === 'running' ? 'bg-amber-100 text-amber-700' :
        status === 'failed' ? 'bg-red-100 text-red-600' :
        'bg-sand-100 text-sand-400'
      }`}>
        {status === 'done' ? <CheckCircle size={13} /> :
         status === 'running' ? <Loader2 size={13} className="animate-spin" /> :
         status === 'failed' ? <XCircle size={13} /> :
         <Clock size={13} />}
      </div>
      <div>
        <p className={`text-sm font-medium ${
          status === 'done' ? 'text-stone-800' :
          status === 'running' ? 'text-amber-700' :
          status === 'failed' ? 'text-red-600' :
          'text-sand-400'
        }`}>{step.label}</p>
        <p className="text-xs text-sand-400 mt-0.5">{step.desc}</p>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');

  const run = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setResult(null);
    setSteps([
      { step: 1, status: 'running' },
      { step: 2, status: 'pending' },
      { step: 3, status: 'pending' },
    ]);

    try {
      const { data } = await axios.post('/api/pipeline/run', { prompt }, { timeout: 600000 });
      setSteps(data.steps || []);
      setResult(data);
    } catch (err) {
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'failed' } : s));
    } finally {
      setRunning(false);
    }
  };

  const getStepStatus = (n) => {
    const s = steps.find(s => s.step === n);
    return s?.status || 'pending';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-sand-200 bg-white">
        <div className="flex items-center gap-2 mb-0.5">
          <Zap size={15} className="text-amber-600" />
          <h1 className="font-semibold text-stone-900 text-sm">Full Pipeline</h1>
        </div>
        <p className="text-xs text-sand-500">Text → Shap-E mesh → Blender render → Preview — all in one click</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-sand-200 bg-white flex flex-col p-5">
          <div className="space-y-2 mb-5">
            <label className="text-xs font-medium text-stone-700">Describe your 3D object</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. a futuristic satellite with solar panels and antenna arrays"
              rows={4}
              className="w-full px-3 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-colors resize-none"
            />
            <button
              onClick={run}
              disabled={!prompt.trim() || running}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {running ? 'Running pipeline...' : 'Run Pipeline'}
            </button>
          </div>

          <div className="border-t border-sand-200 pt-5 space-y-4">
            <p className="text-xs font-medium text-stone-700">Pipeline Steps</p>
            {STEP_LABELS.map(s => (
              <StepIndicator key={s.n} step={s} status={getStepStatus(s.n)} />
            ))}
          </div>

          <div className="border-t border-sand-200 pt-4 mt-4">
            <p className="text-xs text-sand-400 leading-relaxed">
              Requires Shap-E installed (<code className="bg-sand-100 px-1 rounded">pip install shap-e</code>) and Blender in PATH.
              Pipeline takes ~2–5 minutes on CPU, ~1 min on GPU.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {result ? (
            <>
              <div className="border-b border-sand-200 bg-white flex gap-0 px-4">
                {[
                  { key: 'preview', label: '3D Preview' },
                  { key: 'render', label: 'Render' },
                  { key: 'code', label: 'Script' },
                  { key: 'logs', label: 'Logs' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === t.key
                        ? 'border-stone-900 text-stone-900'
                        : 'border-transparent text-sand-500 hover:text-stone-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                {result.objData && (
                  <a
                    href={result.objPath}
                    download
                    className="ml-auto my-2 flex items-center gap-1 px-3 py-1 text-xs border border-sand-200 rounded-lg text-sand-600 hover:bg-sand-50 transition-colors"
                  >
                    <Download size={11} /> .obj
                  </a>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                {activeTab === 'preview' && (
                  <div className="p-5 h-full">
                    <ModelViewer objText={result.objData} className="h-full" />
                  </div>
                )}
                {activeTab === 'render' && (
                  <div className="p-5">
                    {result.renderPath ? (
                      <div>
                        <img src={result.renderPath} alt="Render" className="rounded-xl border border-sand-200 max-w-2xl" />
                        <a
                          href={result.renderPath}
                          download
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-sand-100 hover:bg-sand-200 rounded-lg text-stone-700 transition-colors"
                        >
                          <Download size={11} /> Download render
                        </a>
                      </div>
                    ) : (
                      <div className="text-center text-sand-400 mt-16">
                        <p className="text-sm">No render output — check Blender path in .env</p>
                        <p className="text-xs mt-1">View the logs tab for error details</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'code' && (
                  <pre className="p-5 text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap bg-stone-950 min-h-full">
                    {result.code || '# No script generated'}
                  </pre>
                )}
                {activeTab === 'logs' && (
                  <div className="p-5 space-y-4">
                    {result.meshLog && (
                      <div>
                        <p className="text-xs font-medium text-stone-700 mb-2">Shap-E Log</p>
                        <pre className="text-xs font-mono text-sand-600 bg-sand-50 rounded-xl p-4 overflow-auto whitespace-pre-wrap border border-sand-200">
                          {result.meshLog}
                        </pre>
                      </div>
                    )}
                    {result.blenderLog && (
                      <div>
                        <p className="text-xs font-medium text-stone-700 mb-2">Blender Log</p>
                        <pre className="text-xs font-mono text-sand-600 bg-sand-50 rounded-xl p-4 overflow-auto whitespace-pre-wrap border border-sand-200">
                          {result.blenderLog}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sand-400">
              <div className="text-center">
                <Box size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium text-stone-500">Pipeline output will appear here</p>
                <p className="text-xs mt-1">Run the pipeline to generate a 3D mesh, script, and render</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
