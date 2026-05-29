import { useState } from 'react'
import { supabase, IMAGE_BUCKET, publicImageUrl } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import Modal from './Modal'

export default function NewItemForm({ onClose, onCreated }) {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Please enter a title.')
    const priceNum = parseInt(price, 10)
    if (Number.isNaN(priceNum) || priceNum < 0) return setError('Please enter a valid price.')
    if (file && !file.type.startsWith('image/')) return setError('Only image files are allowed.')
    setBusy(true)
    try {
      let imageUrl = null
      let imagePath = null
      if (file) {
        const ext = file.name.split('.').pop()
        imagePath = `items/${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(imagePath, file, { contentType: file.type })
        if (upErr) throw upErr
        imageUrl = publicImageUrl(imagePath)
      }

      const { error: insErr } = await supabase.from('items').insert({
        seller_id: user.id,
        seller_name: profile?.username || 'anon',
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        image_url: imageUrl,
        image_path: imagePath,
        status: 'available',
      })
      if (insErr) throw insErr
      onCreated?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Upload failed: ' + (err.message || 'unknown error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="List an Item" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
            placeholder="e.g. Shure SM7B microphone"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Price (KRW)</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
            placeholder="e.g. 250000"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
            placeholder="Condition, usage, contact info, etc."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold file:text-ink file:font-bold file:px-4 file:py-2 file:cursor-pointer hover:file:bg-gold-hi"
          />
          {file && <p className="text-xs text-muted mt-1.5">{file.name}</p>}
        </div>
        {error && (
          <p className="text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-gold text-ink font-bold py-3 hover:bg-gold-hi transition-colors disabled:opacity-50"
        >
          {busy ? 'Listing...' : 'List Item'}
        </button>
      </form>
    </Modal>
  )
}
