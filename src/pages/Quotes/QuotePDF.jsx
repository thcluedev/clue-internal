import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page:            { padding: 48, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  brand:           { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#111110' },
  brandSub:        { fontSize: 9, color: '#9a9489', marginTop: 4, letterSpacing: 1 },
  quoteNum:        { fontSize: 11, color: '#e84c1e', fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  quoteDate:       { fontSize: 9, color: '#9a9489', textAlign: 'right', marginTop: 2 },
  divider:         { height: 1, backgroundColor: '#e8e8e8', marginVertical: 20 },
  sectionTitle:    { fontSize: 9, color: '#9a9489', letterSpacing: 1, marginBottom: 6 },
  clientName:      { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111110', marginBottom: 3 },
  clientMail:      { fontSize: 10, color: '#9a9489' },
  tableHeader:     { flexDirection: 'row', backgroundColor: '#f5f5f4', padding: '8 12', marginBottom: 1 },
  thText:          { fontSize: 8, color: '#9a9489', letterSpacing: 0.5, fontFamily: 'Helvetica-Bold' },
  tableRow:        { flexDirection: 'row', padding: '8 12', borderBottomWidth: 1, borderBottomColor: '#f0f0ee' },
  tdText:          { fontSize: 10, color: '#1a1a18' },
  colDesc:         { flex: 3 },
  colQty:          { flex: 0.8, textAlign: 'center' },
  colPrice:        { flex: 1.5, textAlign: 'right' },
  colSub:          { flex: 1.5, textAlign: 'right' },
  totalRow:        { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 14, paddingHorizontal: 12 },
  totalLabel:      { fontSize: 11, color: '#9a9489', marginRight: 28, fontFamily: 'Helvetica-Bold' },
  totalAmount:     { fontSize: 14, color: '#111110', fontFamily: 'Helvetica-Bold' },
  validityText:    { fontSize: 9, color: '#9a9489', textAlign: 'right', marginTop: 6, paddingHorizontal: 12 },
  notes:           { fontSize: 9, color: '#6a6460', lineHeight: 1.6 },
  footer:          { position: 'absolute', bottom: 32, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:      { fontSize: 8, color: '#c8c4bc' },
})

export function QuotePDF({ quote, company }) {
  const total = (quote.items || []).reduce((sum, i) => sum + (i.quantity || 0) * (i.unit_price || 0), 0)
  const quoteNum = `COT-${String(quote.number || 0).padStart(3, '0')}`
  const createdDate = new Date(quote.created_at).toLocaleDateString('es-AR')
  const expiryDate  = new Date(new Date(quote.created_at).getTime() + (quote.valid_days || 15) * 86400000)
    .toLocaleDateString('es-AR')
  const fmt = (n) => `${quote.currency || 'ARS'} ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>CLUE DEV</Text>
            <Text style={s.brandSub}>SOLUCIONES DIGITALES · CBA, AR</Text>
          </View>
          <View>
            <Text style={s.quoteNum}>{quoteNum}</Text>
            <Text style={s.quoteDate}>Emitida: {createdDate}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Cliente */}
        <Text style={s.sectionTitle}>PARA</Text>
        <Text style={s.clientName}>{company?.name || '—'}</Text>
        {company?.email ? <Text style={s.clientMail}>{company.email}</Text> : null}

        <View style={s.divider} />

        {/* Tabla */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colDesc]}>Descripción</Text>
          <Text style={[s.thText, s.colQty]}>Cant.</Text>
          <Text style={[s.thText, s.colPrice]}>P. Unit.</Text>
          <Text style={[s.thText, s.colSub]}>Subtotal</Text>
        </View>

        {(quote.items || []).map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tdText, s.colDesc]}>{item.description || '—'}</Text>
            <Text style={[s.tdText, s.colQty]}>{item.quantity || 0}</Text>
            <Text style={[s.tdText, s.colPrice]}>{fmt(item.unit_price || 0)}</Text>
            <Text style={[s.tdText, s.colSub]}>{fmt((item.quantity || 0) * (item.unit_price || 0))}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={s.divider} />
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalAmount}>{fmt(total)}</Text>
        </View>
        <Text style={s.validityText}>
          Válida por {quote.valid_days || 15} días · hasta el {expiryDate}
        </Text>

        {/* Notas */}
        {quote.notes ? (
          <View>
            <View style={s.divider} />
            <Text style={s.sectionTitle}>NOTAS Y CONDICIONES</Text>
            <Text style={s.notes}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Clue Dev · hola@cluedev.com.ar</Text>
          <Text style={s.footerText}>{quoteNum} · {createdDate}</Text>
        </View>

      </Page>
    </Document>
  )
}
