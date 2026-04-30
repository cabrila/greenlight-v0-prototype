import { Actor } from "@/types/actor-list"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

// Export actors as JSON file
export function exportActorsAsJSON(actors: Actor[], projectName: string) {
  const dataStr = JSON.stringify(actors, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.href = url
  link.download = `${projectName.replace(/\s+/g, "_")}_actors.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export actors as PDF file
export function exportActorsAsPDF(actors: Actor[], projectName: string) {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text(projectName, 14, 20)
  
  // Add subtitle with date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28)
  doc.text(`Total Actors: ${actors.length}`, 14, 34)
  
  // Prepare table data
  const tableData = actors.map((actor, index) => [
    (index + 1).toString(),
    actor.name,
    actor.age?.toString() || "-",
    actor.gender || "-",
    actor.ethnicity || "-",
    actor.location || "-",
    actor.agency || "-",
  ])
  
  // Add table
  autoTable(doc, {
    head: [["#", "Name", "Age", "Gender", "Ethnicity", "Location", "Agency"]],
    body: tableData,
    startY: 42,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244], // emerald-50
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 15 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 35 },
      6: { cellWidth: 35 },
    },
  })
  
  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }
  
  doc.save(`${projectName.replace(/\s+/g, "_")}_actors.pdf`)
}

// Export actors as Excel file
export function exportActorsAsExcel(actors: Actor[], projectName: string) {
  // Prepare data for Excel
  const excelData = actors.map((actor, index) => ({
    "#": index + 1,
    "Name": actor.name,
    "Age": actor.age || "",
    "Gender": actor.gender || "",
    "Ethnicity": actor.ethnicity || "",
    "Location": actor.location || "",
    "Agency": actor.agency || "",
    "Phone": actor.phone || "",
    "Email": actor.email || "",
    "Height": actor.height || "",
    "Weight": actor.weight || "",
    "Hair Color": actor.hairColor || "",
    "Eye Color": actor.eyeColor || "",
    "Skills": actor.skills?.join(", ") || "",
    "Notes": actor.notes || "",
  }))
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  
  // Set column widths
  ws["!cols"] = [
    { wch: 5 },   // #
    { wch: 25 },  // Name
    { wch: 8 },   // Age
    { wch: 12 },  // Gender
    { wch: 15 },  // Ethnicity
    { wch: 20 },  // Location
    { wch: 20 },  // Agency
    { wch: 15 },  // Phone
    { wch: 25 },  // Email
    { wch: 10 },  // Height
    { wch: 10 },  // Weight
    { wch: 12 },  // Hair Color
    { wch: 12 },  // Eye Color
    { wch: 30 },  // Skills
    { wch: 40 },  // Notes
  ]
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Actors")
  
  // Generate and download file
  XLSX.writeFile(wb, `${projectName.replace(/\s+/g, "_")}_actors.xlsx`)
}
