const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');

const upload = multer(); 
const app    = express();

// Serve static files din /public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.post('/generate', upload.fields([
  { name: 'background', maxCount: 1 },
  { name: 'template',   maxCount: 1 },
  { name: 'photo1',     maxCount: 1 },
  { name: 'photo2',     maxCount: 1 },
  { name: 'photo3',     maxCount: 1 },
  { name: 'photo4',     maxCount: 1 },
]), async (req, res) => {
  try {
    const bg     = req.files.background[0].buffer;
    const tpl    = req.files.template[0].buffer;
    const photos = ['photo1','photo2','photo3','photo4'].map(name => ({
      input: req.files[name][0].buffer,
      left:  parseInt(req.body[`${name}_x`], 10),
      top:   parseInt(req.body[`${name}_y`], 10),
    }));

    const compositeArr = [...photos, { input: tpl, left: 0, top: 0 }];

    const outputBuffer = await sharp(bg)
      .composite(compositeArr)
      .png()
      .toBuffer();

    res.set('Content-Type', 'image/png');
    res.send(outputBuffer);
  } catch (err) {
    console.error('Sharp error:', err);
    res.status(500).send('Eroare la generarea collage-ului');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serverul rulează pe http://localhost:${port}`);
});
