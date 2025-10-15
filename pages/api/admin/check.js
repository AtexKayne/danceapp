export default function handler(req,res){
  const pw = req.query.pw || ''
  if (pw === process.env.PW) return res.json({ ok: true })
  return res.status(401).json({ ok: false })
}
