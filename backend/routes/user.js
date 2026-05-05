import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { User, Chat, Image, Script } from '../models/index.js';

const router = Router();
router.use(requireUser);

router.get('/profile', async (req, res, next) => {
  try {
    const [chats, images, scripts] = await Promise.all([
      Chat.countDocuments({ userId: req.uid }),
      Image.countDocuments({ userId: req.uid }),
      Script.countDocuments({ userId: req.uid }),
    ]);
    res.json({ user: req.user, stats: { chats, images, scripts } });
  } catch (err) { next(err); }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const { name, photoURL } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.uid },
      { $set: { ...(name && { name }), ...(photoURL && { photoURL }) } },
      { new: true }
    );
    res.json({ user });
  } catch (err) { next(err); }
});

export default router;
