'use client'

import { useState, useEffect } from 'react'
import { Download, Upload, Plus, Search, Filter, ChevronDown, ChevronUp, Eye, Edit, Trash2, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const SelectComponent = Select as any

interface LeadRecord {
  id: number
  source_id: string
  property: string
  address: string
  city: string
  state: string
  zip: string
  asking: string
  arv: string
  offer: string
  owner: string
  owner_phone: string
  owner_email: string
  repairs: string
  status: string
  notes: string
  equity: string
  beds: string
  baths: string
  sqft: string
  skip_traced: boolean
  property_type: string
  created_at: string
}

const STATUSES = ['New', 'Contacted', 'Qualified', 'Offer Made', 'Under Contract', 'Closed Won', 'Closed Lost', 'Dead']

export function LeadsCSVPanel({ user }: { user: any }) {
  const [records, setRecords] = useState<LeadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const supabase = createClient()

  async function fetchRecords() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('property_leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      console.error('Error fetching records:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.property?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.source_id?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const obj: any = {}
      headers.forEach((header, i) => {
        obj[header] = values[i] || ''
      })
      return obj
    })
    return rows
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      const parsed = parseCSV(csvText)
      setCsvPreview(parsed.slice(0, 10))
      setUploadError(null)
      ;(event.target as HTMLInputElement).value = ''
    }
    reader.readAsText(file)
  }

  async function handleUploadConfirm() {
    if (csvPreview.length === 0) return
    setUploading(true)
    setUploadError(null)
    
    try {
      const { error } = await supabase
        .from('property_leads')
        .insert(csvPreview.map(row => ({
          source_id: row.source_id || row['Source ID'] || row.id || '',
          address: row.address || row.Address || row['Property Address'] || '',
          city: row.city || row.City || '',
          state: row.state || row.State || '',
          zip: row.zip || row.Zip || row['Zip Code'] || '',
          property_type: row.property_type || row['Property Type'] || row['Property Type'] || '',
          estimated_value: row.estimated_value || row['Estimated Value'] || row.arv || row.ARV || 0,
          estimated_equity: row.estimated_equity || row['Estimated Equity'] || row.equity || 0,
          estimated_equity_percentage: row.estimated_equity_percentage || row['Equity %'] || 0,
          bedrooms: row.bedrooms || row.Bedrooms || row.Beds || 0,
          bathrooms: row.bathrooms || row.Bathrooms || row.Baths || 0,
          living_area_sf: row.living_area_sf || row['Living Area'] || row.sqft || row.SqFt || 0,
          lot_size_sf: row.lot_size_sf || row['Lot Size'] || 0,
          year_built: row.year_built || row['Year Built'] || 0,
          owner_name: row.owner_name || row['Owner Name'] || row.owner || '',
          owner_occupied: row.owner_occupied || row['Owner Occupied'] === 'true' || false,
          company_owned: row.company_owned || row['Company Owned'] === 'true' || false,
          individual_owned: row.individual_owned || row['Individual Owned'] === 'true' || true,
          trust_owned: row.trust_owned || row['Trust Owned'] === 'true' || false,
          latitude: row.latitude || row.Latitude || 0,
          longitude: row.longitude || row.Longitude || 0,
          mls_status: row.mls_status || row['MLS Status'] || '',
          lead_types: row.lead_types ? [row.lead_types] : row.LeadTypes ? [row.LeadTypes] : [],
        })))
      
      if (error) throw error
      
      setShowUploadModal(false)
      setCsvPreview([])
      ;(document.getElementById('csv-file-input') as HTMLInputElement).value = ''
      fetchRecords()
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload records')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteRecord(id: number) {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      const { error } = await supabase
        .from('property_leads')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchRecords()
    } catch (err) {
      console.error('Error deleting record:', err)
    }
  }

  function exportCSV() {
    if (filteredRecords.length === 0) return
    
    const headers = [
      'source_id', 'address', 'city', 'state', 'zip', 'property_type',
      'estimated_value', 'estimated_equity', 'estimated_equity_percentage',
      'bedrooms', 'bathrooms', 'living_area_sf', 'lot_size_sf', 'year_built',
      'owner_name', 'owner_occupied', 'company_owned', 'individual_owned', 'trust_owned',
      'latitude', 'longitude', 'mls_status', 'lead_types'
    ]
    
    const rows = filteredRecords.map(r => headers.map(h => r[h as keyof LeadRecord] ?? ''))
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const statusColors: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-yellow-100 text-yellow-800',
    'Qualified': 'bg-purple-100 text-purple-800',
    'Offer Made': 'bg-orange-100 text-orange-800',
    'Under Contract': 'bg-green-100 text-green-800',
    'Closed Won': 'bg-emerald-100 text-emerald-800',
    'Closed Lost': 'bg-red-100 text-red-800',
    'Dead': 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">Upload CSV, manage records, track deal flow</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportCSV} disabled={filteredRecords.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search property, address, owner, ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <SelectComponent value={statusFilter} onValueChange={(v: string | null) => { if (v) setStatusFilter(v); }} className="w-full sm:w-48">
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </SelectComponent>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No records found</p>
            <p className="text-sm mt-1">Upload a CSV file to get started</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Property / Source ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Address</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Owner</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Asking</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">ARV</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Offer</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Equity</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Beds/Baths</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.property || '—'}</p>
                      <p className="text-xs text-muted-foreground">{record.source_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{record.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.city}, {record.state} {record.zip}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{record.owner || '—'}</p>
                      <p className="text-xs text-muted-foreground">{record.owner_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{record.asking}</td>
                    <td className="px-4 py-3 text-foreground">{record.arv}</td>
                    <td className="px-4 py-3 text-foreground">{record.offer}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[record.status] || 'bg-gray-100 text-gray-800')}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{record.equity}</td>
                    <td className="px-4 py-3 text-foreground">{record.beds} / {record.baths}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRecord(record.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Upload CSV</h2>
              <Button variant="ghost" size="icon" onClick={() => { setShowUploadModal(false); setCsvPreview([]); setUploadError(null) }}>
                <Upload className="h-5 w-5 rotate-180" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {csvPreview.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Drag and drop a CSV file or click to browse</p>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="csv-file-input">
                    <Button variant="outline">Choose File</Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">CSV should include columns: source_id, address, city, state, zip, property_type, estimated_value, estimated_equity, estimated_equity_percentage, bedrooms, bathrooms, living_area_sf, lot_size_sf, year_built, owner_name, owner_occupied, company_owned, individual_owned, trust_owned, latitude, longitude, mls_status, lead_types</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{csvPreview.length} records ready to import</p>
                    <span className="text-xs text-muted-foreground">Showing first 10 rows</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          {csvPreview[0] ? Object.keys(csvPreview[0]).map(key => (
                            <th key={key} className="px-2 py-1 text-left font-semibold">{key}</th>
                          )) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
{Object.entries(row).map(([, val], j) => (
                            <td key={j} className="px-2 py-1 truncate max-w-[150px]">{String(val)}</td>
                          ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {uploadError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={() => { setShowUploadModal(false); setCsvPreview([]); setUploadError(null) }}>
                Cancel
              </Button>
              <Button onClick={handleUploadConfirm} disabled={uploading || csvPreview.length === 0}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Importing...
                  </>
                ) : (
                  `Import ${csvPreview.length} Records`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}