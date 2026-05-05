import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { Image } from '../models/index.js';

const router = Router();
router.use(requireUser);

const HF_URL = `https://api-inference.huggingface.co/models/${process.env.HF_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0'}`;

router.post('/generate', async (req, res, next) => {
  try {
    const { prompt, count = 1 } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });

    const requests = Array.from({ length: Math.min(count, 4) }, () =>
      fetch(HF_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
      }).then(r => r.arrayBuffer()).then(buf => Buffer.from(buf).toString('base64'))
    );

    const base64images = await Promise.all(requests);
    const urls = base64images.map(b => `data:image/jpeg;base64,${b}`);

    const saved = await Image.insertMany(
      urls.map(url => ({ userId: req.uid, prompt: prompt.trim(), url, status: 'done' }))
    );
    await req.user.updateOne({ $inc: { 'usage.images': urls.length } });
    res.json({ images: saved });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const images = await Image.find({ userId: req.uid, status: 'done' }).sort({ createdAt: -1 }).limit(40);
    res.json({ images });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Image.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
