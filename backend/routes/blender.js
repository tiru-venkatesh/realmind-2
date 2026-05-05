import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import Groq from 'groq-sdk';
import { requireUser } from '../middleware/auth.js';
import { Script } from '../models/index.js';

const router = Router();
router.use(requireUser);
const execAsync = promisify(exec);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// backend/routes/blender.js — replace BPY_SYSTEM prompt

const BPY_SYSTEM = `You are a Blender 4.x Python expert.

Always structure scripts in this exact order:
1. Scene setup (clear, units, fps)
2. Materials library (create all materials first)
3. Geometry creation (mesh, curves, metaballs)
4. UV unwrapping
5. Modifier stack (Subdivision, Bevel, Boolean, Array)
6. Rigging if animated (armature, weights)
7. Camera setup (position, focal length, DOF)
8. HDRI lighting + area lights
9. Render settings (Cycles, denoising, output path)
10. Optional: animation keyframes

Rules:
- Use bmesh for complex geometry, never bpy.ops for mesh editing
- Always use Principled BSDF with proper PBR values
- Set render to Cycles GPU, samples 256, denoising ON
- Output ONLY Python. No markdown. No comments unless explaining math.
- Start with: import bpy, bmesh, mathutils, math, random`;

router.post('/generate', async (req, res, next) => {
  try {
    const { prompt, title } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: BPY_SYSTEM },
        { role: 'user', content: `Create a Blender script for: ${prompt}` },
      ],
      max_tokens: 3000, temperature: 0.2,
    });

    let code = completion.choices[0].message.content.trim()
      .replace(/^```python\n?/m, '').replace(/^```\n?/m, '').replace(/```$/m, '').trim();

    const script = await Script.create({
      userId: req.uid,
      title: title || prompt.slice(0, 60),
      prompt: prompt.trim(),
      code,
    });

    await req.user.updateOne({ $inc: { 'usage.scripts': 1 } });
    res.status(201).json({ script });
  } catch (err) { next(err); }
});

router.post('/:id/run', async (req, res, next) => {
  try {
    const script = await Script.findOne({ _id: req.params.id, userId: req.uid });
    if (!script) return res.status(404).json({ error: 'Script not found' });

    const dir = process.env.SCRIPTS_DIR || './output/scripts';
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.resolve(path.join(dir, `script_${script._id}.py`));
    await fs.writeFile(filePath, script.code, 'utf8');

    await Script.findByIdAndUpdate(script._id, { status: 'running', filePath });

    const blender = process.env.BLENDER_PATH || 'blender';
    let log = '', status = 'done';

    try {
      const { stdout, stderr } = await execAsync(
        `"${blender}" --background --python "${filePath}" 2>&1`,
        { timeout: 90000 }
      );
      log = stdout + (stderr ? '\n' + stderr : '');
    } catch (execErr) {
      log = execErr.stdout || execErr.message;
      status = 'failed';
    }

    const updated = await Script.findByIdAndUpdate(
      script._id,
      { status, log, executedAt: new Date() },
      { new: true }
    );
    res.json({ script: updated });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const scripts = await Script.find({ userId: req.uid })
      .select('title prompt status createdAt executedAt').sort({ createdAt: -1 }).limit(40);
    res.json({ scripts });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const script = await Script.findOne({ _id: req.params.id, userId: req.uid });
    if (!script) return res.status(404).json({ error: 'Not found' });
    res.json({ script });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Script.findOneAndDelete({ _id: req.params.id, userId: req.uid });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
