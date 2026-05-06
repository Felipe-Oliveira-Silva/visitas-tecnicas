import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ── Palette ────────────────────────────────────────────────────────────────────
const AMBER  = '#d97706'
const DARK   = '#0f172a'
const MUTED  = '#64748b'
const BORDER = '#e2e8f0'
const LIGHT  = '#f8fafc'

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    fontSize: 11,
    color: DARK,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: `2px solid ${AMBER}`,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  companyName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 3,
  },
  companySub: { fontSize: 9, color: MUTED, marginBottom: 1 },
  headerRight: { alignItems: 'flex-end' },
  docTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: AMBER,
  },
  docCode: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    marginTop: 3,
  },
  docDate: { fontSize: 9, color: MUTED, marginTop: 2 },

  // RASCUNHO banner
  draftBanner: {
    backgroundColor: '#fef3c7',
    border: `1px solid #fbbf24`,
    borderRadius: 4,
    padding: '7 12',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
  },
  draftSub: { fontSize: 9, color: '#92400e' },

  // Sections
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: AMBER,
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  // Label/value pairs
  row: { flexDirection: 'row', marginBottom: 5, gap: 8 },
  col: { flex: 1 },
  label: { fontSize: 8, color: MUTED, marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, color: DARK },

  // Items table
  table: { marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: '5 8',
    borderBottom: `1px solid #fde68a`,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottom: `1px solid ${BORDER}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: LIGHT,
  },
  tableCell: { fontSize: 10, color: DARK },

  colDesc:  { flex: 3 },
  colQty:   { width: 44, textAlign: 'right' },
  colUnit:  { width: 76, textAlign: 'right' },
  colTotal: { width: 76, textAlign: 'right' },

  // Totals block
  totalsOuter: { alignItems: 'flex-end', marginTop: 10 },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
    marginBottom: 4,
  },
  totalLineLabel: { fontSize: 10, color: MUTED },
  totalLineValue: { fontSize: 10, color: DARK, textAlign: 'right' },
  discountLineValue: { fontSize: 10, color: '#dc2626', textAlign: 'right' },
  grandLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 6,
    marginTop: 4,
  },
  grandLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  grandValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: AMBER,
    textAlign: 'right',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 6,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmtDatetime(d: Date | string): string {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Reliable BRL formatting that works in any Node.js environment
function fmtBRL(n: number): string {
  const fixed = n.toFixed(2)
  const [int, dec] = fixed.split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${intFmt},${dec}`
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OrcamentoPDFProps {
  quotation: {
    id:          string
    title:       string
    status:      string
    description: string | null
    notes:       string | null
    validUntil:  Date | null
    discount:    number
    subtotal:    number
    total:       number
    createdAt:   Date
    client: {
      name:    string
      cnpj:    string | null
      address: string | null
      city:    string | null
      state:   string | null
    }
    createdBy: { name: string }
    items: Array<{
      description: string
      quantity:    number
      unitPrice:   number
      total:       number
    }>
  }
  generatedAt: Date
  company: {
    name:    string
    cnpj:    string | null
    phone:   string | null
    email:   string | null
    address: string | null
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function OrcamentoPDF({ quotation: q, generatedAt, company }: OrcamentoPDFProps) {
  const isDraft = q.status === 'DRAFT'
  const orcCode = `ORC-${q.id.slice(-6).toUpperCase()}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* 1. Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.cnpj    && <Text style={styles.companySub}>CNPJ: {company.cnpj}</Text>}
            {company.phone   && <Text style={styles.companySub}>Tel: {company.phone}</Text>}
            {company.email   && <Text style={styles.companySub}>{company.email}</Text>}
            {company.address && <Text style={styles.companySub}>{company.address}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>ORÇAMENTO</Text>
            <Text style={styles.docCode}>{orcCode}</Text>
            <Text style={styles.docDate}>Emitido em {fmtDate(q.createdAt)}</Text>
          </View>
        </View>

        {/* 2. Banner RASCUNHO */}
        {isDraft && (
          <View style={styles.draftBanner}>
            <Text style={styles.draftLabel}>⚠ RASCUNHO</Text>
            <Text style={styles.draftSub}>
              Este documento é um rascunho e ainda não foi enviado ao cliente.
            </Text>
          </View>
        )}

        {/* 3. Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{q.client.name}</Text>
            </View>
            {q.client.cnpj && (
              <View style={styles.col}>
                <Text style={styles.label}>CNPJ</Text>
                <Text style={styles.value}>{q.client.cnpj}</Text>
              </View>
            )}
          </View>
          {(q.client.address || q.client.city) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Endereço</Text>
                <Text style={styles.value}>
                  {[q.client.address, q.client.city, q.client.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 4. Dados do orçamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Orçamento</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Título</Text>
              <Text style={styles.value}>{q.title}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Elaborado por</Text>
              <Text style={styles.value}>{q.createdBy.name}</Text>
            </View>
            {q.validUntil && (
              <View style={styles.col}>
                <Text style={styles.label}>Válido até</Text>
                <Text style={styles.value}>{fmtDate(q.validUntil)}</Text>
              </View>
            )}
          </View>
          {q.description && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Descrição</Text>
                <Text style={styles.value}>{q.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 5. Itens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Orçamento</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDesc]}>Descrição</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qtd</Text>
              <Text style={[styles.tableHeaderText, styles.colUnit]}>Valor Unit.</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            </View>
            {q.items.map((item, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{fmtBRL(item.unitPrice)}</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{fmtBRL(item.total)}</Text>
              </View>
            ))}
          </View>

          {/* Totais */}
          <View style={styles.totalsOuter}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>Subtotal</Text>
              <Text style={styles.totalLineValue}>{fmtBRL(q.subtotal)}</Text>
            </View>
            {q.discount > 0 && (
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Desconto</Text>
                <Text style={styles.discountLineValue}>− {fmtBRL(q.discount)}</Text>
              </View>
            )}
            <View style={styles.grandLine}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{fmtBRL(q.total)}</Text>
            </View>
          </View>
        </View>

        {/* 6. Observações */}
        {q.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.value}>{q.notes}</Text>
          </View>
        )}

        {/* 7. Rodapé */}
        <Text style={styles.footer}>
          {`Documento gerado em ${fmtDatetime(generatedAt)} · Relatec`}
        </Text>

      </Page>
    </Document>
  )
}
