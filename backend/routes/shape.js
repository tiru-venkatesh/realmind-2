// backend/routes/shape.js
import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { requireUser } from '../middleware/auth.js';

const router = Router();
const execAsync = promisify(exec);
router.use(requireUser);

// Python script that runs Shap-E
const SHAPE_SCRIPT = (prompt, outputPath) => `
import torch
from shap_e.diffusion.sample import sample_latents
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
from shap_e.models.download import load_model, load_config
from shap_e.util.notebooks import decode_latent_mesh

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
xm = load_model('transmitter', device=device)
model = load_model('text300M', device=device)
diffusion = diffusion_from_config(load_config('diffusion'))

latents = sample_latents(
    batch_size=1, model=model, diffusion=diffusion,
    guidance_scale=15.0, model_kwargs=dict(texts=["${prompt}"]),
    progress=True, clip_denoised=True, use_fp16=True, use_karras=True,
    karras_steps=64, sigma_min=1e-3, sigma_max=160, s_churn=0,
)

with open("${outputPath}", 'wb') as f:
    decode_latent_mesh(xm, latents[0]).tri_mesh().write_obj(f)

print("SUCCESS: ${outputPath}")
`;

router.post('/generate-mesh', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });

    const outputDir = './output/meshes';
    await fs.mkdir(outputDir, { recursive: true });

    const scriptPath = path.resolve(`${outputDir}/shap_e_${Date.now()}.py`);
    const objPath = path.resolve(`${outputDir}/mesh_${Date.now()}.obj`);

    await fs.writeFile(scriptPath, SHAPE_SCRIPT(prompt, objPath));

    const { stdout } = await execAsync(`python3 "${scriptPath}"`, { timeout: 120000 });

    const objData = await fs.readFile(objPath, 'utf8');
    res.json({ obj: objData, path: objPath, log: stdout });
  } catch (err) { next(err); }
});

export default router;