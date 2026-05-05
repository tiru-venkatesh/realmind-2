import { useState } from 'react';
import axios from 'axios';
import { Wand2, Loader2, Download, X } from 'lucide-react';

export default function ImagePage() {
  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState('');
  const [count, setCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/image/generate', {
        prompt,
        negative_prompt: negative,
        num_images: count
      });
      setImages(prev => [...data.images, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed. Check your HuggingFace API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-sand-200 bg-white">
        <h1 className="font-semibold text-stone-900 text-sm">Image Generation</h1>
        <p className="text-xs text-sand-500">Stable Diffusion XL via HuggingFace (free tier)</p>
      </div>

      <div className="p-5 border-b border-sand-200 bg-white">
        <div className="max-w-2xl space-y-3">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your image in detail..."
            rows={2}
            className="w-full px-4 py-3 text-sm bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-colors resize-none"
          />
          <input
            value={negative}
            onChange={e => setNegative(e.target.value)}
            placeholder="Negative prompt (optional) — blurry, ugly, distorted..."
            className="w-full px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-sand-600">Images:</label>
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                    count === n ? 'bg-stone-900 text-white' : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={generate}
              disabled={!prompt.trim() || loading}
              className="flex items-center gap-1.5 px-5 py-2 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {images.length === 0 && !loading && (
          <div className="text-center mt-16 text-sand-400">
            <p className="text-sm">Generated images will appear here</p>
          </div>
        )}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && Array.from({ length: count }).map((_, i) => (
            <div key={i} className="aspect-square bg-sand-100 rounded-xl animate-pulse flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-sand-400" />
            </div>
          ))}
          {images.map((src, i) => (
            <div
              key={i}
              className="group relative aspect-square bg-sand-100 rounded-xl overflow-hidden cursor-pointer border border-sand-200 hover:border-stone-400 transition-colors"
              onClick={() => setExpanded(src)}
            >
              <img src={src} alt={`gen-${i}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <a
                href={src}
                download
                onClick={e => e.stopPropagation()}
                className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <Download size={12} className="text-stone-700" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
          onClick={() => setExpanded(null)}
        >
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
          <img src={expanded} alt="expanded" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
