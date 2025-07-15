import React, { memo, useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const ImportExportModal = memo(({ financeManager, theme, t }) => {
  const { state, actions } = financeManager;
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (file.type !== 'application/json') {
      actions.showNotification('Veuillez sélectionner un fichier JSON', 'error');
      return;
    }

    const success = await actions.importData(file);
    if (success) {
      actions.toggleModal('import', false);
    }
  };

  return (
    <Modal
      isOpen={state.modals.import}
      onClose={() => actions.toggleModal('import', false)}
      title="Importer/Exporter des données"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        <div>
          <h4 className={`font-medium ${theme.text} mb-3`}>Exporter les données</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={actions.exportData}
              className="flex items-center justify-center space-x-2"
              aria-label="Exporter toutes les données en JSON"
            >
              <Icons.Download className="h-4 w-4" />
              <span>Export JSON</span>
            </Button>
            <Button
              onClick={actions.exportExpensesToCSV}
              variant="outline"
              className="flex items-center justify-center space-x-2"
              aria-label="Exporter les dépenses en CSV"
            >
              <Icons.FileText className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className={`font-medium ${theme.text} mb-3`}>Importer les données</h4>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
            aria-label="Zone de glisser-déposer pour importer un fichier"
          >
            <Icons.Upload className={`h-8 w-8 mx-auto mb-2 ${theme.textSecondary}`} />
            <p className={theme.text}>
              Glissez un fichier JSON ici ou cliquez pour sélectionner
            </p>
            <p className={`text-xs ${theme.textSecondary} mt-1`}>
              Seuls les fichiers JSON sont acceptés
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>

        <div className="border-t pt-6">
          <Button
            onClick={actions.resetAllData}
            variant="danger"
            className="w-full flex items-center justify-center space-x-2"
            aria-label="Réinitialiser toutes les données"
          >
            <Icons.AlertTriangle className="h-4 w-4" />
            <span>Réinitialiser toutes les données</span>
          </Button>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
            ⚠️ Cette action est irréversible
          </p>
        </div>
      </div>
    </Modal>
  );
});

export default ImportExportModal; 