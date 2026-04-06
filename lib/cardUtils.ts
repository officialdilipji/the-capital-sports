import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadCardAsPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: null,
      onclone: (clonedDoc) => {
        // Remove ALL style and link tags to prevent oklch/modern CSS from crashing html2canvas
        // The card itself uses inline styles so it will still look correct
        const styles = Array.from(clonedDoc.getElementsByTagName('style'));
        styles.forEach(s => s.remove());
        
        const links = Array.from(clonedDoc.getElementsByTagName('link'));
        links.forEach(l => {
          if (l.rel === 'stylesheet') l.remove();
        });
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}_Membership_Card.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to download PDF. Please try again.');
  }
};

export const printCard = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: null,
      onclone: (clonedDoc) => {
        const styles = Array.from(clonedDoc.getElementsByTagName('style'));
        styles.forEach(s => s.remove());
        const links = Array.from(clonedDoc.getElementsByTagName('link'));
        links.forEach(l => {
          if (l.rel === 'stylesheet') l.remove();
        });
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Membership Card</title>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; }
            img { max-width: 100%; height: auto; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); border-radius: 1.5rem; }
            @media print {
              body { background: white; padding: 0; }
              img { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing card:', error);
    alert('Failed to prepare card for printing.');
  }
};
