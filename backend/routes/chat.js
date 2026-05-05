import { Router } from 'express';
import Groq from 'groq-sdk';
import { requireUser } from '../middleware/auth.js';
import { Chat } from '../models/index.js';

const router = Router();
router.use(requireUser);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM = {
  primary: `You are RealMind AI — expert in 3D modeling concepts, Blender Python scripting, and engineering design.
Give structured, implementation-ready responses. Use headings and code blocks where helpful.`,
  secondary: `You are RealMind Analyzer. Review primary AI output and explain:
- Structure and logic of the generated content
- Improvements and optimizations
- Real-world applications and use cases
- Edge cases and limitations`,
};

router.get('/', async (req, res, next) => {
  try {
    const sessions = await Chat.find({ userId: req.uid }).select('title type updatedAt').sort({ updatedAt: -1 }).limit(50);
    res.json({ sessions });
  } catch (err) { next(err); }
});

router.post('/session', async (req, res, next) => {
  try {
    const { type = 'primary', linkedChatId } = req.body;
    const session = await Chat.create({ userId: req.uid, type, linkedChatId: linkedChatId || null });
    res.status(201).json({ session });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const session = await Chat.findOne({ _id: req.params.id, userId: req.uid });
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json({ session });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Chat.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/:id/stream', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const session = await Chat.findOne({ _id: req.params.id, userId: req.uid });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.messages.push({ role: 'user', content: content.trim() });
    const context = session.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM[session.type] }, ...context],
      max_tokens: 2048, temperature: 0.65, stream: true,
    });

    let full = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) { full += delta; res.write(`data: ${JSON.stringify({ delta })}\n\n`); }
    }
    res.write('data: [DONE]\n\n');
    res.end();

    session.messages.push({ role: 'assistant', content: full });
    if (session.messages.length === 2) session.title = content.slice(0, 60);
    await session.save();
    await req.user.updateOne({ $inc: { 'usage.messages': 1 } });
  } catch (err) { next(err); }
});

export default router;
