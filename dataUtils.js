// Fonctions d'export/import de données extraites de App.js
export const dataUtils = {
  exportToJSON: (data) => {
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: data
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  exportToCSV: (data, filename = 'expenses') => {
    const csvContent = [
      ['Date', 'Catégorie', 'Description', 'Montant'].join(','),
      ...data.map(item => [
        item.date,
        item.category,
        `"${item.description}"`,
        item.amount
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  importFromJSON: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.version && data.data) {
            resolve(data.data);
          } else {
            reject(new Error('Format de fichier invalide'));
          }
        } catch (error) {
          reject(new Error('Fichier JSON invalide'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  }
}; 