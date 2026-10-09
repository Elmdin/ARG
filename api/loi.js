// Logs every LOI / pre-order. View them in Vercel > Project > Logs (filter "DEAL").
module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  console.log("DEAL", JSON.stringify(req.body));
  res.json({ ok: true });
};
