import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axiosInstance from "../services/axiosInstance";

const AdminCustomerReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatorPerformance, setCreatorPerformance] = useState([]);

  const tableRef = useRef(null);

  useEffect(() => {
    axiosInstance.get('/followups/report')
      .then(res => {
        if (res.data && Array.isArray(res.data.report)) {
          setReport(res.data.report);
          setCreatorPerformance(res.data.creatorPerformance || []);
        } else {
          setError("Invalid report data format.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch report. Backend may be down or unreachable.");
        setLoading(false);
      });
  }, []);

  const handleExportPDF = async () => {
    const input = tableRef.current;
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: "landscape" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save("customer_report.pdf");
  };

  if (loading) return <div>Loading report...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  // Responsive CSS styles
  const containerStyle = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 8px"
  };
  const tableWrapperStyle = {
    width: "100%",
    overflowX: "auto"
  };
  const tableStyle = {
    width: "100%",
    minWidth: 700,
    borderCollapse: "collapse",
    marginTop: "24px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    borderRadius: "8px",
    overflow: "hidden"
  };
  const thStyle = {
    background: "#003366",
    color: "#fff",
    padding: "12px",
    fontWeight: "600",
    textAlign: "left",
    fontSize: "1rem"
  };
  const tdStyle = {
    padding: "12px",
    borderBottom: "1px solid #eee",
    fontSize: "15px",
    wordBreak: "break-word"
  };
  const creatorStyle = {
    background: "#f6f8fa",
    borderRadius: "6px",
    padding: "8px",
    fontSize: "14px",
    marginTop: "4px"
  };

  return (
    
      <div style={containerStyle}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ color: "#003366", fontWeight: 700, fontSize: "2rem" }}>Customer Service User Report</h2>
          <span style={{ color: '#555', fontSize: '1rem', fontWeight: 500 }}>
            {new Date().toLocaleDateString()} | Professional Summary
          </span>
        </div>
        <button
          onClick={handleExportPDF}
          style={{
            background: "linear-gradient(90deg,#003366 60%,#0055a5 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "10px 22px",
            fontWeight: 600,
            fontSize: "1.05rem",
            marginBottom: "18px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
          }}
        >
          <span style={{ marginRight: 8, fontSize: '1.2em' }}>📄</span>
          Export as PDF
        </button>
        {/* Supervisor summary section */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#003366', fontWeight: 600, fontSize: '1.3rem', marginBottom: 8 }}>Creator Performance (Supervisor View)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...tableStyle, minWidth: 400 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Creator</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {creatorPerformance.map((creator, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{creator.username}</td>
                    <td style={tdStyle}>{creator.points}</td>
                    <td style={tdStyle}>{creator.rating} out of 5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={tableWrapperStyle}>
          <table style={tableStyle} ref={tableRef}>
            <thead>
              <tr>
                <th style={thStyle}>Customer Name</th>
                <th style={thStyle}>Notes</th>
                <th style={thStyle}>Last Call Date</th>
                <th style={thStyle}>Daily Progress</th>
                <th style={thStyle}>Creator Rating</th>
                <th style={thStyle}>Creator</th>
              </tr>
            </thead>
            <tbody>
              {report.map((user, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{user.clientName}</td>
                  <td style={tdStyle}>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {user.notes && user.notes.length > 0 ? user.notes.map((note, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{note.text}</li>
                      )) : <span style={{ color: "#888" }}>No notes</span>}
                    </ul>
                  </td>
                  <td style={tdStyle}>{user.lastCalled ? new Date(user.lastCalled).toLocaleDateString() : "-"}</td>
                  <td style={tdStyle}>{user.dailyProgress || "-"}</td>
                  <td style={tdStyle}>
                    {user.creator && typeof user.creator.rating === 'number' ? `${user.creator.rating} out of 5` : "-"}
                  </td>
                  <td style={tdStyle}>
                    {user.creator && user.creator.username ? (
                      <div style={creatorStyle}>
                        <div><strong>{user.creator.username}</strong></div>
                        <div>Points: {user.creator.points}</div>
                        <div>Rating: {user.creator.rating} out of 5</div>
                      </div>
                    ) : (
                      <span style={{ color: "#d32f2f", fontWeight: 600 }}>
                        No creator info available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
   
  );
};

export default AdminCustomerReport;
