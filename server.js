const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');

const upload = multer();
const app    = express();

// 1) Serve static din /public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 2) GET / → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3) POST /generate → primește doar cele 4 poze
app.post(
  '/generate',
  upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 },
    { name: 'photo4', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // 3.1) Path și metadata pentru template.png
      const templatePath = path.join(__dirname, 'public', 'template.png');
      const tplMeta      = await sharp(templatePath).metadata();
      const canvasW      = tplMeta.width;
      const canvasH      = tplMeta.height;

      // 3.2) Slot-urile (coordonate + dimensiuni)
      const slots = [
        { left: 118, top:  185, width: 531, height: 637 },
        { left: 767, top:  185, width: 566, height: 637 },
        { left: 118, top: 1140, width: 531, height: 670 },
        { left: 767, top: 1140, width: 566, height: 670 },
      ];

      // 3.3) Redimensionează cele 4 poze
      const names = ['photo1','photo2','photo3','photo4'];
      const resized = await Promise.all(
        slots.map(({ width, height }, i) =>
          sharp(req.files[names[i]][0].buffer)
            .resize(width, height, { fit: 'cover' })
            .toBuffer()
        )
      );

      // 3.4) Construiește array-ul de compoziție:
      //     întâi pozele, apoi template-ul peste toate
      const compositeArr = resized.map((buf, i) => ({
        input: buf,
        left:  slots[i].left,
        top:   slots[i].top,
      }));
      compositeArr.push({ input: templatePath, left: 0, top: 0 });

      // 3.5) Crează un canvas alb, suprapune tot şi exportă PNG
      const outputBuffer = await sharp({
        create: {
          width:       canvasW,
          height:      canvasH,
          channels:    4,
          background:  '#ffffff',
        }
      })
        .composite(compositeArr)
        .png()
        .toBuffer();

      // 3.6) Trimite PNG-ul rezultat
      res.set('Content-Type', 'image/png');
      return res.send(outputBuffer);

    } catch (err) {
      console.error('🔴 Sharp error:', err);
      return res
        .status(500)
        .send(`Eroare la generarea collage-ului: ${err.message}`);
    }
  }
);

// 4) Pornește serverul
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${port}`);
});
