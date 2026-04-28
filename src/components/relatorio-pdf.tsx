import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    fontSize: 11,
    color: '#0f172a',
  },
  // --- Cabeçalho ---
  header: {
    marginBottom: 24,
    borderBottom: '2px solid #0891b2',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0891b2',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 9,
    color: '#64748b',
  },
  // --- Seções ---
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0891b2',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  // --- Campos label/value ---
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    gap: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 10,
    color: '#0f172a',
  },
  // --- Tabelas (checklist / medições) ---
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: '5 8',
    borderBottom: '1px solid #cbd5e1',
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottom: '1px solid #f1f5f9',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 10,
    color: '#0f172a',
  },
  tableCellOk: {
    fontSize: 10,
    color: '#16a34a',
    fontFamily: 'Helvetica-Bold',
  },
  tableCellFail: {
    fontSize: 10,
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
  colItem: { flex: 3 },
  colStatus: { flex: 1 },
  colName: { flex: 2 },
  colValue: { flex: 2 },
  // --- Assinatura ---
  signatureBox: {
    marginTop: 8,
    padding: 12,
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    alignItems: 'center',
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginBottom: 6,
    objectFit: 'contain',
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  signatureSub: {
    fontSize: 9,
    color: '#64748b',
  },
  // --- Rodapé ---
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: '1px solid #e2e8f0',
    paddingTop: 6,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

// ---- Tipos ----
interface RelatorioPDFProps {
  report: {
    id: string
    observations: string | null
    createdAt: Date
    checklistData: Record<string, boolean> | null
    measurementData: Record<string, string> | null
    visit: {
      scheduledAt: Date
      realizedAt: Date | null
      observations: string | null
      client: {
        name: string
        cnpj: string | null
        address: string | null
        city: string | null
        state: string | null
      }
      technician: {
        name: string
      }
    }
    filledBy: {
      name: string
    }
    signature: {
      signerName: string
      signerDoc: string | null
      signedAt: Date
      imageBase64: string // já convertida para base64 antes de passar ao componente
    } | null
  }
  generatedAt: Date
  plan: string | null
  company: {
    name: string
    cnpj: string | null
    phone: string | null
    email: string | null
    address: string | null
  }
}

function fmt(date: Date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function fmtDatetime(date: Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RelatorioPDF({ report, generatedAt, plan, company }: RelatorioPDFProps) {
  const { visit } = report
  const checklist = report.checklistData
  const medicoes = report.measurementData

  return (
    <Document>
      <Page size="A4" style={styles.page}>

{/* 1. Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{company.name}</Text>
          {company.cnpj && (
            <Text style={styles.headerSub}>CNPJ: {company.cnpj}</Text>
          )}
          {(company.phone || company.email) && (
            <Text style={styles.headerSub}>
              {[company.phone, company.email].filter(Boolean).join(' · ')}
            </Text>
          )}
          {company.address && (
            <Text style={styles.headerSub}>{company.address}</Text>
          )}
          <Text style={[styles.headerSub, { marginTop: 6 }]}>
            Relatório de Visita Técnica — Gerado em {fmtDatetime(generatedAt)}
          </Text>
        </View>

        {/* 2. Dados da Visita */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados da Visita</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{visit.client.name}</Text>
            </View>
            {visit.client.cnpj && (
              <View style={styles.col}>
                <Text style={styles.label}>CNPJ</Text>
                <Text style={styles.value}>{visit.client.cnpj}</Text>
              </View>
            )}
          </View>

          {(visit.client.address || visit.client.city) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Endereço</Text>
                <Text style={styles.value}>
                  {[visit.client.address, visit.client.city, visit.client.state]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Técnico Responsável</Text>
              <Text style={styles.value}>{visit.technician.name}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Data Agendada</Text>
              <Text style={styles.value}>{fmt(visit.scheduledAt)}</Text>
            </View>
            {visit.realizedAt && (
              <View style={styles.col}>
                <Text style={styles.label}>Data Realizada</Text>
                <Text style={styles.value}>{fmt(visit.realizedAt)}</Text>
              </View>
            )}
          </View>

          {visit.observations && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Observações da Visita</Text>
                <Text style={styles.value}>{visit.observations}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 3. Dados do Relatório */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Relatório</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Preenchido por</Text>
              <Text style={styles.value}>{report.filledBy.name}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Data de Criação</Text>
              <Text style={styles.value}>{fmt(report.createdAt)}</Text>
            </View>
          </View>
          {report.observations && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Observações do Relatório</Text>
                <Text style={styles.value}>{report.observations}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 4. Checklist */}
        {checklist && Object.keys(checklist).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
                <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
              </View>
              {Object.entries(checklist).map(([item, ok], i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, styles.colItem]}>{item}</Text>
                  <Text style={[ok ? styles.tableCellOk : styles.tableCellFail, styles.colStatus]}>
                    {ok ? '✓ OK' : '✗ NOK'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Medições */}
        {medicoes && Object.keys(medicoes).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medições</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colName]}>Parâmetro</Text>
                <Text style={[styles.tableHeaderText, styles.colValue]}>Valor</Text>
              </View>
              {Object.entries(medicoes).map(([nome, valor], i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, styles.colName]}>{nome}</Text>
                  <Text style={[styles.tableCell, styles.colValue]}>{valor}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Assinatura */}
        {report.signature && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assinatura</Text>
            <View style={styles.signatureBox}>
              <Image
                style={styles.signatureImage}
                src={`data:image/png;base64,${report.signature.imageBase64}`}
              />
              <Text style={styles.signatureName}>{report.signature.signerName}</Text>
              {report.signature.signerDoc && (
                <Text style={styles.signatureSub}>Doc: {report.signature.signerDoc}</Text>
              )}
              <Text style={styles.signatureSub}>
                Assinado em {fmtDatetime(report.signature.signedAt)}
              </Text>
            </View>
          </View>
        )}

        {/* 7. Rodapé */}
        <Text style={styles.footer}>
          {plan === 'enterprise'
            ? `Documento gerado em ${fmtDatetime(generatedAt)}`
            : plan === 'pro'
              ? `Documento gerado em ${fmtDatetime(generatedAt)} · Gerado por Relatec`
              : `Documento gerado em ${fmtDatetime(generatedAt)} · Sistema fornecido por Relatec — relatec.com.br`
          }
        </Text>

      </Page>
    </Document>
  )
}