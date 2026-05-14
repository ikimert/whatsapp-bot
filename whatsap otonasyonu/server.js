import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'randevu123';
let randevular = [];

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('Webhook Calisiyor');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const verifyToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && verifyToken === whatsappVerifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.get('/randevu', (_req, res) => {
  res.status(200).json(randevular);
});

app.post('/randevu', (req, res) => {
  const { isim, telefon, tarih, saat, durum } = req.body || {};

  if (!isim || !telefon || !tarih || !saat || !durum) {
    return res.status(400).json({ message: 'Eksik alanlar var.' });
  }

  const yeniRandevu = {
    id: Date.now(),
    isim,
    telefon,
    tarih,
    saat,
    durum,
  };

  randevular.push(yeniRandevu);
  return res.status(201).json(yeniRandevu);
});

app.delete('/randevu/:id', (req, res) => {
  const id = Number(req.params.id);
  const oncekiUzunluk = randevular.length;
  randevular = randevular.filter((item) => item.id !== id);

  if (randevular.length === oncekiUzunluk) {
    return res.status(404).json({ message: 'Randevu bulunamadi.' });
  }

  return res.sendStatus(204);
});

app.post('/webhook', (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (message) {
    const phoneNumber = message.from;
    const textBody = message.text?.body;
    console.log('WHATSAPP MESAJI:', phoneNumber, textBody);
  }

  return res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server ${port} portunda calisiyor`);
});
