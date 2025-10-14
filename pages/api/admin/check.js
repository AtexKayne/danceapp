export default function handler(req,res){
  const pw = req.query.pw || ''
  if (pw === 'admin123') return res.json({ ok: true })
  return res.status(401).json({ ok: false })
}
