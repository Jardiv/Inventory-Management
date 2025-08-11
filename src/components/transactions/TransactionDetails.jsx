import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const tdStyle = "bg-background px-4 py-2 max-h-[20px]";
const thStyle = "px-3 py-1";
const details = "py-0.5";

export default function TransactionDetails({
    transactionId,
    showSupplierDetails,
}) {
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (transactionId) {
            const fetchTransactionDetails = async () => {
                try {
                    const response = await fetch(
                        `/api/transactions/details?id=${transactionId}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setTransaction(data);
                    }
                } catch (error) {
                    console.error("Error fetching transaction details:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTransactionDetails();
        }
    }, [transactionId]);
    const handlePDF = async (isView) => {
        if (!transaction) return;

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;

            // ======= Helper to load logo =======
            const loadImageAsDataURL = async (paths) => {
                const tryLoad = (src) =>
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL("image/png"));
                        };
                        img.onerror = reject;
                        img.src = src;
                    });
                for (const p of paths) {
                    try {
                        return await tryLoad(p);
                    } catch (_) {}
                }
                throw new Error("Logo not found");
            };

            // ======= Helper to embed Poppins font =======
            const arrayBufferToBase64 = (buffer) => {
                const bytes = new Uint8Array(buffer);
                let binary = "";
                const chunkSize = 0x8000;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                    const chunk = bytes.subarray(i, i + chunkSize);
                    binary += String.fromCharCode.apply(null, chunk);
                }
                return btoa(binary);
            };
            const tryEmbedFont = async (path, vfsName, family, style) => {
                const res = await fetch(path);
                if (!res.ok) throw new Error("font fetch failed");
                const buf = await res.arrayBuffer();
                doc.addFileToVFS(vfsName, arrayBufferToBase64(buf));
                doc.addFont(vfsName, family, style);
            };

            let hasPoppins = false;
            try {
                await Promise.all([
                    tryEmbedFont(
                        "/fonts/Poppins-Regular.ttf",
                        "Poppins-Regular.ttf",
                        "Poppins",
                        "normal"
                    ),
                    tryEmbedFont(
                        "/fonts/Poppins-Bold.ttf",
                        "Poppins-Bold.ttf",
                        "Poppins",
                        "bold"
                    ),
                ]);
                hasPoppins = true;
            } catch (_) {}

            // ======= Branded Header =======
            let headerBottomY = 56;
            try {
                const logoDataUrl = await loadImageAsDataURL([
                    "/ims_logo.png",
                    "/ims%20logo.png",
                    "/ims logo.png",
                    "/logo.png",
                ]);

                const logoX = margin;
                const logoY = 12;
                const logoW = 30;
                const logoH = 30;
                doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH);

                const textX = logoX + logoW + 6;
                let lineY = logoY + Math.round(logoH / 2);
                doc.setFont(hasPoppins ? "Poppins" : "helvetica", "bold");
                doc.setFontSize(26);
                doc.text("IMS", textX, lineY);

                lineY += 6;
                doc.setFont(hasPoppins ? "Poppins" : "helvetica", "normal");
                doc.setFontSize(12);
                doc.text("Inventory Management System", textX, lineY);

                lineY += 6;
                doc.setFontSize(9);
                doc.text("Address • Phone • Email • Website", textX, lineY);

                const rightX = pageWidth - margin;
                doc.setFont(hasPoppins ? "Poppins" : "helvetica", "normal");
                doc.setFontSize(28);
                doc.text("TRANSACTION", rightX, logoY + 14, { align: "right" });

                headerBottomY = Math.max(logoY + logoH, lineY + 6) + 4;
            } catch (e) {
                doc.setFont(hasPoppins ? "Poppins" : "helvetica", "bold");
                doc.setFontSize(26);
                doc.text("IMS", margin, 24);

                doc.setFont(hasPoppins ? "Poppins" : "helvetica", "normal");
                doc.setFontSize(12);
                doc.text("Inventory Management System", margin, 30);

                doc.setFontSize(28);
                doc.text("TRANSACTION", pageWidth - margin, 24, {
                    align: "right",
                });

                headerBottomY = Math.max(46, 30 + 6);
            }

            // Divider
            doc.setDrawColor(0);
            doc.setLineWidth(0.6);
            const dividerY = headerBottomY - 2;
            doc.line(margin, dividerY, pageWidth - margin, dividerY);

            // ======= Content =======
            let cursorY = dividerY + 10;
            doc.setFont(hasPoppins ? "Poppins" : "helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Transaction Details", margin, cursorY);
            cursorY += 10;

            const HEADER_COLOR = [22, 160, 133];

            // Primary Details Table
            const primaryDetails = [
                ["Invoice #", transaction.invoice_no],
                [
                    "Date",
                    new Date(
                        transaction.transaction_datetime
                    ).toLocaleDateString(),
                ],
                ["Warehouse", transaction.warehouse_name || "N/A"],
                ["Status", transaction.status],
            ];
            autoTable(doc, {
                head: [["Field", "Value"]],
                body: primaryDetails,
                startY: cursorY,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: {
                    fillColor: HEADER_COLOR,
                    textColor: 255,
                    fontSize: 10,
                },
                margin: { left: margin },
            });

            // Supplier Details Table
            if (transaction.supplier_name) {
                let supplierY = doc.lastAutoTable.finalY + 8;
                doc.setFont(hasPoppins ? "Poppins" : "helvetica", "bold");
                doc.setFontSize(14);
                doc.text("Supplier Details", margin, supplierY);
                const supplierDetails = [
                    ["Name", transaction.supplier_name],
                    [
                        "Contact",
                        transaction.supplier_contact?.toString() || "N/A",
                    ],
                    ["Location", transaction.supplier_location || "N/A"],
                ];
                autoTable(doc, {
                    head: [["Field", "Value"]],
                    body: supplierDetails,
                    startY: supplierY + 4,
                    theme: "grid",
                    styles: { fontSize: 9, cellPadding: 2 },
                    headStyles: {
                        fillColor: HEADER_COLOR,
                        textColor: 255,
                        fontSize: 10,
                    },
                    margin: { left: margin },
                });
            }

            // Items Table
            let itemsY = doc.lastAutoTable.finalY + 8;
            doc.setFont(hasPoppins ? "Poppins" : "helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Items Purchased", margin, itemsY);
            autoTable(doc, {
                head: [
                    ["Item", "Quantity", "Expiry Date", "Unit Price", "Total"],
                ],
                body: transaction.items.map((item) => [
                    item.name,
                    `${item.quantity} pcs`,
                    item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString()
                        : "N/A",
                    `₱ ${item.unit_price.toFixed(2)}`,
                    `₱ ${(item.unit_price * item.quantity).toFixed(2)}`,
                ]),
                startY: itemsY + 4,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: {
                    fillColor: HEADER_COLOR,
                    textColor: 255,
                    fontSize: 10,
                },
                margin: { left: margin },
            });

            // Summary Table
            let summaryY = doc.lastAutoTable.finalY + 8;
            doc.setFont(hasPoppins ? "Poppins" : "helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Summary", margin, summaryY);
            const summaryDetails = [
                ["Total Quantity", `${transaction.total_quantity} Items`],
                ["Total Price", `₱ ${transaction.total_price}`],
            ];
            autoTable(doc, {
                head: [["Field", "Value"]],
                body: summaryDetails,
                startY: summaryY + 4,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: {
                    fillColor: HEADER_COLOR,
                    textColor: 255,
                    fontSize: 10,
                },
                margin: { left: margin },
            });

            // ======= Footer =======
            const pageCount = doc.internal.getNumberOfPages();
            doc.setPage(pageCount);
            const finalPageHeight = doc.internal.pageSize.getHeight();
            doc.setDrawColor(200);
            doc.line(
                margin,
                finalPageHeight - 35,
                pageWidth - margin,
                finalPageHeight - 35
            );
            doc.setFontSize(10);
            doc.text(
                "Thank you for your business!",
                pageWidth / 2,
                finalPageHeight - 25,
                { align: "center" }
            );

            // Output
            if (isView) {
                const pdfBlob = doc.output("blob");
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl);
            } else {
                doc.save(`transaction_${transaction.invoice_no}.pdf`);
            }
        } catch (err) {
            alert("PDF generation failed: " + err.message);
            console.error("PDF generation error:", err);
        }
    };

    return (
        <div className="bg-primary px-6 py-4 rounded-lg h-full overflow-auto">
            <div className="flex justify-between h-header">
                <div>
                    <h1 className="font-semibold text-2xl">
                        Transaction Details
                    </h1>
                    <p className="text-border_color">
                        Detailed breakdown of the transaction.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePDF(true)}
                        className="p-2 h-fit text-textColor-primary hover:bg-btn-hover cursor-pointer rounded "
                        title="View PDF"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="ww-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => handlePDF(false)}
                        className="p-2 h-fit text-textColor-primary hover:bg-btn-hover cursor-pointer rounded "
                        title="Download PDF"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 h-fit text-textColor-primary hover:bg-btn-hover cursor-pointer rounded "
                        title="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-5 gap-4 h-120 animate-pulse">
                    <div className="col-span-3 py-4">
                        <div className="h-6 bg-border_color rounded w-1/3 mb-4"></div>
                        <div className="bg-background border-[0.5px] border-border_color px-4 py-2 overflow-x-auto h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="h-4 bg-border_color rounded w-full"></div>
                                <div className="h-4 bg-border_color rounded w-full"></div>
                                <div className="h-4 bg-border_color rounded w-full"></div>
                                <div className="h-4 bg-border_color rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="gap-20 px-8 col-span-2">
                        <div className="flex flex-col">
                            <div className="h-6 bg-border_color rounded w-1/3 mb-4"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-border_color rounded w-full"></div>
                                <div className="h-4 bg-border_color rounded w-full"></div>
                                <div className="h-4 bg-border_color rounded w-full"></div>
                            </div>
                        </div>
                        {showSupplierDetails && (
                            <div className="flex flex-col mt-12">
                                <div className="h-6 bg-border_color rounded w-1/3 mb-4"></div>
                                <div className="space-y-4">
                                    <div className="h-4 bg-border_color rounded w-full"></div>
                                    <div className="h-4 bg-border_color rounded w-full"></div>
                                    <div className="h-4 bg-border_color rounded w-full"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : transaction ? (
                <div className="grid grid-cols-6 gap-4 min-h-[80%] pb-6">
                    <div className="col-span-4 py-4">
                        <h2 className="text-lg font-semibold mb-2">
                            Item Details
                        </h2>
                        <div className="bg-background border-[0.5px] border-border_color px-4 py-2 h-full flex flex-col">
                            <div className="overflow-y-auto flex-grow">
                                <table className="w-full text-left table-fixed">
                                    <thead>
                                        <tr className="border-b-[0.5px]">
                                            <th
                                                className={`${thStyle} w-[30%]`}
                                            >
                                                Item
                                            </th>
                                            <th className={thStyle}>
                                                Quantity
                                            </th>
                                            <th className={thStyle}>
                                                Expiry Date
                                            </th>
                                            <th className={thStyle}>
                                                Unit Price
                                            </th>
                                            <th className={thStyle}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transaction.items.map(
                                            (item, index) => (
                                                <tr
                                                    className="table-row"
                                                    key={index}
                                                >
                                                    <td className={tdStyle}>
                                                        <a
                                                            href="#"
                                                            className="hover:underline text-textColor-primary"
                                                        >
                                                            {item.name}
                                                        </a>
                                                    </td>
                                                    <td className={tdStyle}>
                                                        {item.quantity}
                                                    </td>
                                                    <td className={tdStyle}>
                                                        {item.expiry_date
                                                            ? new Date(
                                                                  item.expiry_date
                                                              ).toLocaleDateString()
                                                            : "N/A"}
                                                    </td>
                                                    <td className={tdStyle}>
                                                        ₱ {item.unit_price}
                                                    </td>
                                                    <td className={tdStyle}>
                                                        ₱{" "}
                                                        {(
                                                            item.unit_price *
                                                            item.quantity
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals pinned at bottom */}
                            <div className="border-t-[0.5px] mt-2 pt-2">
                                <table className="w-full text-left table-fixed">
                                    <tfoot>
                                        <tr>
                                            <td
                                                className={`${tdStyle} w-[30%] font-semibold`}
                                            >
                                                Totals
                                            </td>
                                            <td
                                                className={`${tdStyle} font-semibold`}
                                            >
                                                {transaction.total_quantity}{" "}
                                                items
                                            </td>
                                            <td className={tdStyle}></td>
                                            <td className={tdStyle}></td>
                                            <td
                                                className={`${tdStyle} font-semibold`}
                                            >
                                                ₱ {transaction.total_price}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="gap-12 px-8 col-span-2 flex flex-col">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold mb-2">
                                Primary Details
                            </h2>
                            <hr className="mb-4" />
                            <table className="w-full">
                                <tbody>
                                    <tr className="">
                                        <td
                                            className={`${details} font-semibold`}
                                        >
                                            Invoice Number
                                        </td>
                                        <td className={details}>
                                            {transaction.invoice_no}
                                        </td>
                                    </tr>
                                    <tr className="">
                                        <td
                                            className={`${details} font-semibold`}
                                        >
                                            Date
                                        </td>
                                        <td className={details}>
                                            {new Date(
                                                transaction.transaction_datetime
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                    <tr className="">
                                        <td
                                            className={`${details} font-semibold`}
                                        >
                                            Time
                                        </td>
                                        <td className={details}>
                                            {new Date(
                                                transaction.transaction_datetime
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}
                                        </td>
                                    </tr>
                                    <tr className="">
                                        <td
                                            className={`${details} font-semibold`}
                                        >
                                            Status
                                        </td>
                                        <td className={details}>
                                            <span
                                                className={`inline-block text-center w-[6rem] px-3 py-1 text-sm font-semibold rounded-full ${
                                                    {
                                                        Delivered:
                                                            "bg-green/10 text-green",
                                                        Completed:
                                                            "bg-green/10 text-green",
                                                        "In Transit":
                                                            "bg-orange/10 text-orange",
                                                        Pending:
                                                            "bg-yellow-500/20 text-yellow-400",
                                                        Canceled:
                                                            "bg-red/10 text-red",
                                                    }[transaction.status] ||
                                                    "bg-textColor-tertiary/10 text-textColor-tertiary"
                                                }`}
                                            >
                                                {transaction.status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="">
                                        <td
                                            className={`${details} font-semibold`}
                                        >
                                            Created By
                                        </td>
                                        <td className={details}>
                                            {transaction.created_by}
                                        </td>
                                    </tr>
                                    {transaction.warehouse_name && (
                                        <tr className="">
                                            <td
                                                className={`${details} font-semibold`}
                                            >
                                                From
                                            </td>
                                            <td className={details}>
                                                {transaction.warehouse_name}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {transaction.supplier_name && (
                            <div className="flex flex-col">
                                <h2 className="text-lg font-semibold mb-2">
                                    Supplier Details
                                </h2>
                                <hr className="mb-4" />
                                <table className="w-full">
                                    <tbody>
                                        <tr className="">
                                            <td
                                                className={`${details} font-semibold`}
                                            >
                                                Supplier
                                            </td>
                                            <td className={details}>
                                                {transaction.supplier_name}
                                            </td>
                                        </tr>
                                        <tr className="">
                                            <td
                                                className={`${details} font-semibold`}
                                            >
                                                Contact No
                                            </td>
                                            <td className={details}>
                                                {transaction.supplier_contact}
                                            </td>
                                        </tr>
                                        <tr className="">
                                            <td
                                                className={`${details} font-semibold`}
                                            >
                                                Location
                                            </td>
                                            <td className={details}>
                                                {transaction.supplier_location}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center text-textColor-tertiary py-10">
                    No details found for this transaction.
                </div>
            )}
        </div>
    );
}
