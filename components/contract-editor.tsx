'use client'

import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Contact {
  id: number
  name: string
  avatar: string
}

const CONTACTS: Contact[] = [
  { id: 1, name: 'Sarah Mitchell', avatar: 'SM' },
  { id: 2, name: 'James Okafor', avatar: 'JO' },
  { id: 3, name: 'Priya Sharma', avatar: 'PS' },
  { id: 4, name: 'Design Team', avatar: 'DT' },
  { id: 5, name: 'Tom Engel', avatar: 'TE' },
  { id: 6, name: 'Fatima Al-Hassan', avatar: 'FA' },
]

const AVATAR_COLORS: Record<string, string> = {
  SM: 'bg-rose-400',
  JO: 'bg-emerald-500',
  PS: 'bg-violet-400',
  DT: 'bg-sky-500',
  TE: 'bg-amber-400',
  FA: 'bg-teal-400',
}

const TEMPLATES = [
  { label: 'Blank', value: 'blank', body: '' },
  {
    label: 'NDA',
    value: 'nda',
    body: `This Non-Disclosure Agreement ("Agreement") is entered into as of the date signed below, between the parties listed above.

1. CONFIDENTIAL INFORMATION
Each party may disclose to the other party certain confidential and proprietary information ("Confidential Information") in connection with a potential business relationship between the parties.

2. OBLIGATIONS
Each party agrees to: (a) hold the other party's Confidential Information in strict confidence; (b) not disclose such Confidential Information to third parties without prior written consent; (c) use the Confidential Information solely for the purpose of evaluating the potential business relationship.

3. EXCLUSIONS
This Agreement does not apply to information that: (a) is or becomes publicly available through no breach of this Agreement; (b) was rightfully known prior to disclosure; (c) is independently developed without use of Confidential Information.

4. TERM
This Agreement shall remain in effect for a period of two (2) years from the date of signing, unless terminated earlier by mutual written consent.

5. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with applicable law. Any disputes arising out of this Agreement shall be resolved through binding arbitration.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date written above.`,
  },
  {
    label: 'Service Agreement',
    value: 'service',
    body: `This Service Agreement ("Agreement") is made effective as of the date signed below between the parties listed above.

1. SERVICES
The Service Provider agrees to perform the following services ("Services") for the Client as described and agreed upon between both parties prior to commencement of work.

2. COMPENSATION
The Client agrees to pay the Service Provider the agreed-upon fee for the Services rendered. Payment terms shall be as mutually agreed in writing prior to the start of Services.

3. TERM
This Agreement shall commence on the effective date and continue until the Services are completed, unless terminated earlier pursuant to the terms herein.

4. TERMINATION
Either party may terminate this Agreement with thirty (30) days written notice. Upon termination, Client shall pay for all Services rendered up to the termination date.

5. INTELLECTUAL PROPERTY
All work product, deliverables, and materials created by the Service Provider under this Agreement shall be owned by the Client upon full payment of all fees.

6. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of any proprietary information shared during the course of this Agreement.

7. LIMITATION OF LIABILITY
In no event shall either party be liable for indirect, incidental, or consequential damages arising from this Agreement.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date written above.`,
  },
  {
    label: 'Employment Offer',
    value: 'employment',
    body: `This Employment Offer Letter is extended by the Company to the Candidate named above, subject to the following terms and conditions.

1. POSITION
The Candidate is offered the position as agreed upon, reporting to the designated manager or department head within the Company.

2. START DATE
The anticipated start date is to be mutually agreed upon by both parties in writing prior to commencement of employment.

3. COMPENSATION
The Company will pay the agreed-upon annual salary, payable in accordance with the Company's standard payroll schedule.

4. BENEFITS
The Employee shall be entitled to participate in benefit programs offered to similarly situated employees, subject to the terms and eligibility requirements of those plans.

5. AT-WILL EMPLOYMENT
Employment with the Company is at-will, meaning either party may terminate the employment relationship at any time, with or without cause or notice.

6. CONFIDENTIALITY AND IP
As a condition of employment, the Employee agrees to sign the Company's standard Confidentiality and Intellectual Property Assignment Agreement.

7. ACCEPTANCE
This offer is contingent upon successful completion of a background check and reference verification. Please sign and return this letter by the date indicated to confirm acceptance.

IN WITNESS WHEREOF, the parties have agreed to the terms of this offer as of the date written above.`,
  },
]

const today = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export function ContractEditor() {
  const [title, setTitle] = useState('Service Agreement')
  const [partyA, setPartyA] = useState('')
  const [partyB, setPartyB] = useState('')
  const [date, setDate] = useState(today)
  const [body, setBody] = useState(TEMPLATES[2].body)
  const [selectedTemplate, setSelectedTemplate] = useState('service')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)

  function applyTemplate(value: string) {
    const tpl = TEMPLATES.find((t) => t.value === value)
    if (!tpl) return
    setSelectedTemplate(value)
    setBody(tpl.body)
    if (value === 'nda') setTitle('Non-Disclosure Agreement')
    else if (value === 'service') setTitle('Service Agreement')
    else if (value === 'employment') setTitle('Employment Offer Letter')
    else setTitle('Contract')
  }

  async function downloadPdf() {
    const el = captureRef.current
    if (!el) return
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 60))
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        width: el.scrollWidth,
        height: el.scrollHeight,
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4', hotfixes: ['px_scaling'] })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      const scale = pageW / canvas.width
      const scaledTotalH = canvas.height * scale
      const canvasPageH = pageH / scale

      let canvasY = 0
      let page = 0
      while (canvasY < canvas.height) {
        if (page > 0) pdf.addPage()
        const sliceH = Math.min(canvasPageH, canvas.height - canvasY)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = Math.ceil(canvasPageH)
        const ctx = sliceCanvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx.drawImage(canvas, 0, canvasY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
        const sliceData = sliceCanvas.toDataURL('image/png')
        pdf.addImage(sliceData, 'PNG', 0, 0, pageW, pageH)
        canvasY += canvasPageH
        page++
      }

      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  function toggleContact(id: number) {
    setSelectedContacts((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function sendContract() {
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    const names = CONTACTS.filter((c) => selectedContacts.includes(c.id)).map((c) => c.name)
    setSentTo(names)
    setSending(false)
    setShowSendModal(false)
    setSelectedContacts([])
  }

  return (
    <div className="size-full flex flex-col bg-[#f5f2ee] font-[Inter,sans-serif]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e9e2d8] shrink-0">

        <div className="flex items-center gap-2">
          <select
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
            className="text-[13px] text-[#54656f] bg-[#f0f2f5] border-none rounded-full px-3 py-1.5 outline-none cursor-pointer"
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="flex bg-[#f0f2f5] rounded-full p-0.5">
            <button
              onClick={() => setMode('edit')}
              className={`text-[13px] px-3 py-1 rounded-full transition-colors font-medium ${
                mode === 'edit' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#54656f]'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`text-[13px] px-3 py-1 rounded-full transition-colors font-medium ${
                mode === 'preview' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#54656f]'
              }`}
            >
              Preview
            </button>
          </div>

          <button
            onClick={downloadPdf}
            disabled={generating}
            className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9e2d8] transition-colors disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            {generating ? 'Generating…' : 'Download PDF'}
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 text-[13px] font-medium px-4 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
            Send Contract
          </button>
        </div>
      </header>

      {/* Sent banner */}
      {sentTo.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2 bg-emerald-50 border-b border-emerald-200 shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <p className="text-[13px] text-emerald-700 font-medium">Contract sent to {sentTo.join(', ')}</p>
          <button onClick={() => setSentTo([])} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 overflow-y-auto flex justify-center items-stretch py-8 px-4">
        <div ref={previewRef} className="w-full max-w-[794px] bg-white shadow-lg rounded-sm flex flex-col" style={{ padding: '72px 80px' }}>
          {mode === 'edit' ? (
            <div className="flex flex-col flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contract Title"
                className="text-[28px] font-semibold text-[#1a1a1a] text-center border-b-2 border-dashed border-[#e9e2d8] pb-3 outline-none focus:border-emerald-400 transition-colors bg-transparent"
              />

              <div className="grid grid-cols-2 gap-6 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-widest">Party A / Client</label>
                  <input
                    type="text"
                    value={partyA}
                    onChange={(e) => setPartyA(e.target.value)}
                    placeholder="Full name or company"
                    className="text-[14px] text-[#1a1a1a] border-b border-dashed border-[#e9e2d8] py-1.5 outline-none focus:border-emerald-400 transition-colors bg-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-widest">Party B / Provider</label>
                  <input
                    type="text"
                    value={partyB}
                    onChange={(e) => setPartyB(e.target.value)}
                    placeholder="Full name or company"
                    className="text-[14px] text-[#1a1a1a] border-b border-dashed border-[#e9e2d8] py-1.5 outline-none focus:border-emerald-400 transition-colors bg-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-widest">Effective Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. September 1, 2026"
                  className="text-[14px] text-[#1a1a1a] border-b border-dashed border-[#e9e2d8] py-1.5 outline-none focus:border-emerald-400 transition-colors bg-transparent w-64"
                />
              </div>

              <hr className="border-[#e9e2d8] my-4" />

              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                placeholder="Write the contract terms here…"
                className="text-[14px] leading-7 text-[#2d2d2d] outline-none resize-none bg-transparent placeholder:text-[#c0bab2] w-full"
                style={{ minHeight: '500px', height: 'auto', overflow: 'hidden' }}
              />

              <div className="mt-auto pt-6">
                <hr className="border-[#e9e2d8]" />
                <div className="grid grid-cols-2 gap-12 mt-2 pb-4">
                  <div>
                    <div className="border-b border-[#1a1a1a] mb-1 h-10" />
                    <p className="text-[12px] text-[#8696a0]">{partyA || 'Party A Signature'}</p>
                    <p className="text-[12px] text-[#8696a0]">Date: _______________</p>
                  </div>
                  <div>
                    <div className="border-b border-[#1a1a1a] mb-1 h-10" />
                    <p className="text-[12px] text-[#8696a0]">{partyB || 'Party B Signature'}</p>
                    <p className="text-[12px] text-[#8696a0]">Date: _______________</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <h1 className="text-[28px] font-semibold text-[#1a1a1a] text-center border-b border-[#e9e2d8] pb-4">{title || 'Untitled Contract'}</h1>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-widest mb-1">Party A / Client</p>
                  <p className="text-[14px] text-[#1a1a1a]">{partyA || <span className="text-[#c0bab2] italic">Not specified</span>}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-widest mb-1">Party B / Provider</p>
                  <p className="text-[14px] text-[#1a1a1a]">{partyB || <span className="text-[#c0bab2] italic">Not specified</span>}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-widest mb-1">Effective Date</p>
                <p className="text-[14px] text-[#1a1a1a]">{date}</p>
              </div>

              <hr className="border-[#e9e2d8] my-4" />

              <div className="text-[14px] leading-7 text-[#2d2d2d] whitespace-pre-wrap flex-1">{body}</div>

              <div className="mt-auto pt-6">
                <hr className="border-[#e9e2d8]" />
                <div className="grid grid-cols-2 gap-12 mt-2 pb-4">
                  <div>
                    <div className="border-b border-[#1a1a1a] mb-2 h-10" />
                    <p className="text-[12px] text-[#8696a0]">{partyA || 'Party A Signature'}</p>
                    <p className="text-[12px] text-[#8696a0] mt-0.5">Date: _______________</p>
                  </div>
                  <div>
                    <div className="border-b border-[#1a1a1a] mb-2 h-10" />
                    <p className="text-[12px] text-[#8696a0]">{partyB || 'Party B Signature'}</p>
                    <p className="text-[12px] text-[#8696a0] mt-0.5">Date: _______________</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden off-screen capture div */}
      <div
        ref={captureRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '794px',
          height: 'auto',
          background: '#ffffff',
          padding: '72px 80px',
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
          zIndex: -1,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1a1a1a', textAlign: 'center', borderBottom: '1px solid #e9e2d8', paddingBottom: 16, marginBottom: 20 }}>
          {title || 'Untitled Contract'}
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Party A / Client</p>
            <p style={{ fontSize: 14, color: '#1a1a1a' }}>{partyA || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Party B / Provider</p>
            <p style={{ fontSize: 14, color: '#1a1a1a' }}>{partyB || '—'}</p>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Effective Date</p>
          <p style={{ fontSize: 14, color: '#1a1a1a' }}>{date}</p>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e9e2d8', margin: '16px 0' }} />
        <p style={{ fontSize: 14, lineHeight: 1.75, color: '#2d2d2d', whiteSpace: 'pre-wrap', marginBottom: 32 }}>{body}</p>
        <hr style={{ border: 'none', borderTop: '1px solid #e9e2d8', margin: '24px 0 16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ borderBottom: '1px solid #1a1a1a', height: 40, marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: '#8696a0', margin: '4px 0' }}>{partyA || 'Party A Signature'}</p>
            <p style={{ fontSize: 12, color: '#8696a0', margin: '4px 0' }}>Date: _______________</p>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #1a1a1a', height: 40, marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: '#8696a0', margin: '4px 0' }}>{partyB || 'Party B Signature'}</p>
            <p style={{ fontSize: 12, color: '#8696a0', margin: '4px 0' }}>Date: _______________</p>
          </div>
        </div>
      </div>

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f0ebe3]">
              <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Send Contract</h2>
              <p className="text-[13px] text-[#8696a0] mt-0.5">Choose recipients from your contacts</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[320px]">
              {CONTACTS.map((contact) => {
                const selected = selectedContacts.includes(contact.id)
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3 border-b border-[#f5f5f5] transition-colors text-left ${
                      selected ? 'bg-emerald-50' : 'hover:bg-[#f9f9f9]'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${
                        AVATAR_COLORS[contact.avatar] ?? 'bg-slate-400'
                      }`}
                    >
                      {contact.avatar}
                    </div>
                    <span className="flex-1 text-[14px] font-medium text-[#1a1a1a]">{contact.name}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selected ? 'bg-emerald-500 border-emerald-500' : 'border-[#d9d9d9]'
                      }`}
                    >
                      {selected && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="px-5 py-4 border-t border-[#f0ebe3] flex gap-2">
              <button
                onClick={() => {
                  setShowSendModal(false)
                  setSelectedContacts([])
                }}
                className="flex-1 text-[14px] font-medium py-2 rounded-full border border-[#e9e2d8] text-[#54656f] hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendContract}
                disabled={selectedContacts.length === 0 || sending}
                className="flex-1 text-[14px] font-medium py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending…' : `Send${selectedContacts.length > 0 ? ` (${selectedContacts.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
