import React from "react";
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    PDFDownloadLink,
} from "@react-pdf/renderer";
import { ethers } from "ethers";

// Styles für das PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
        fontFamily: "Helvetica",
    },
    section: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottom: 1,
        paddingBottom: 4,
        marginBottom: 5,
    },
    row: {
        flexDirection: "row",
        borderBottom: 0.5,
        paddingVertical: 2,
    },
    colTiny: {
        width: "6%",
        paddingRight: 5,
    },
    colSmall: {
        width: "14%",
        paddingRight: 5,
    },
    colMedium: {
        width: "20%",
        paddingRight: 5,
    },
    colLarge: {
        width: "40%",
        paddingRight: 5,
        fontSize: 8,
        fontFamily: "Courier", // monospaced
        wordBreak: "break-word",
    },
});

const AuditReportDocument = ({ lotId, steps }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text>Audit Report – Lot {lotId}</Text>
            <Text>Exportdatum: {new Date().toLocaleString()}</Text>

            <View style={styles.section}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colTiny}>#</Text>
                    <Text style={styles.colSmall}>Schritt</Text>
                    <Text style={styles.colSmall}>Zeit</Text>
                    <Text style={styles.colTiny}>OK</Text>
                    <Text style={styles.colMedium}>Bemerkung (off-chain)</Text>
                    <Text style={styles.colTiny}>Ver.</Text>
                    <Text style={styles.colMedium}>Bemerkung Hash (on-chain)</Text>
                </View>

                {steps.map((step, index) => {
                    const computedHash = ethers.keccak256(ethers.toUtf8Bytes(step.bemerkung));
                    const verified = computedHash === step.bemerkungHash;

                    return (
                        <View key={index} style={styles.row}>
                            <Text style={styles.colTiny}>{index + 1}</Text>
                            <Text style={styles.colSmall}>{step.name}</Text>
                            <Text style={styles.colSmall}>{step.timestamp}</Text>
                            <Text style={styles.colTiny}>{step.bestanden ? "YES" : "NO"}</Text>
                            <Text style={styles.colMedium}>{step.bemerkung}</Text>
                            <Text style={styles.colTiny}>{verified ? "YES" : "NO"}</Text>
                            <Text style={styles.colLarge}>{step.bemerkungHash.toString()}</Text>
                        </View>
                    );
                })}
            </View>
        </Page>
    </Document>
);

export const AuditReportButton = ({ lotId, steps }) => (
    <PDFDownloadLink
        document={<AuditReportDocument lotId={lotId} steps={steps} />}
        fileName={`audit-lot-${lotId}.pdf`}
    >
        {({ loading }) =>
            loading ? "PDF wird erstellt..." : "Audit-Report als PDF herunterladen"
        }
    </PDFDownloadLink>
);
