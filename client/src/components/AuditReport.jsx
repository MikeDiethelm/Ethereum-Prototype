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
        backgroundColor: "#eeeeee",
        fontWeight: "bold",
    },
    row: {
        flexDirection: "row",
        borderBottom: 0.5,
        paddingVertical: 6,
        paddingHorizontal: 2,
        alignItems: "center",
    },
    colTiny: {
        width: "5%",
        textAlign: "center",
        fontFamily: "Courier-Bold",
    },
    colTinyRightPad: {
        width: "5%",
        textAlign: "center",
        fontFamily: "Courier-Bold",
        paddingRight: 6,
    },
    colSmall: {
        width: "12%",
        paddingRight: 4,
    },
    colMedium: {
        width: "22%",
        paddingRight: 4,
    },
    colLarge: {
        width: "44%",
        fontSize: 8,
        fontFamily: "Courier",
        color: "#555",
        lineHeight: 1.3,
    },
});

const AuditReportDocument = ({ lotId, steps }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text>Audit Report – Lot {lotId}</Text>
            <Text>Exportdatum: {new Date().toLocaleString("de-DE")}</Text>

            <View style={styles.section}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colTiny}>#</Text>
                    <Text style={styles.colSmall}>Schritt</Text>
                    <Text style={styles.colSmall}>Zeit</Text>
                    <Text style={styles.colTinyRightPad}>OK</Text>
                    <Text style={styles.colMedium}>Bemerkung (off-chain)</Text>
                    <Text style={styles.colTinyRightPad}>Ver.</Text>
                    <Text style={styles.colLarge}>Bemerkung Hash (on-chain)</Text>
                </View>

                {steps.map((step, index) => {
                    const computedHash = ethers.keccak256(ethers.toUtf8Bytes(step.bemerkung));
                    const verified = computedHash === step.bemerkungHash;

                    return (
                        <View key={index} style={styles.row}>
                            <Text style={styles.colTiny}>{index + 1}</Text>
                            <Text style={styles.colSmall}>{step.name}</Text>
                            <Text style={styles.colSmall}>
                                {new Date(step.timestamp).toLocaleString("de-DE")}
                            </Text>
                            <Text style={styles.colTinyRightPad}>
                                {step.bestanden ? "YES" : "NO"}
                            </Text>
                            <Text style={styles.colMedium}>{step.bemerkung}</Text>
                            <Text style={styles.colTinyRightPad}>
                                {verified ? "YES" : "NO"}
                            </Text>
                            <Text style={styles.colLarge}>
                                {step.bemerkungHash.toString()}
                            </Text>
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
