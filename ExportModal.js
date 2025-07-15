import React, { memo, useState } from 'react';
import * as Icons from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ReportGenerator from '../../utils/ReportGenerator';

const ExportModal = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, showNotification } = financeManager;
  const [selectedReport, setSelectedReport] = useState('monthly');
  const [selectedFormat, setSelectedFormat] = useState('html');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const reportTypes = [
    {
      id: 'monthly',
      icon: Icons.Calendar,
      title: t('monthlyReport'),
      description: t('monthlyReportDesc')
    },
    {
      id: 'annual',
      icon: Icons.TrendingUp,
      title: t('annualReport'),
      description: t('annualReportDesc')
    },
    {
      id: 'budget',
      icon: Icons.Target,
      title: t('budgetAnalysis'),
      description: t('budgetAnalysisDesc')
    },
    {
      id: 'savings',
      icon: Icons.PiggyBank,
      title: t('savingsReport'),
      description: t('savingsReportDesc')
    },
    {
      id: 'debts',
      icon: Icons.CreditCard,
      title: t('debtAnalysis'),
      description: t('debtAnalysisDesc')
    }
  ];

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      // Calculer les données nécessaires pour le rapport
      const currentMonthExpenses = state.expenses.filter(e => 
        e.date.startsWith(state.selectedMonth)
      );
      
      const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalBudget = state.categories.reduce((sum, cat) => sum + cat.budget, 0);
      const savingsRate = state.monthlyIncome > 0 ? ((state.monthlyIncome - totalSpent) / state.monthlyIncome) * 100 : 0;
      
      const reportData = {
        type: selectedReport,
        data: {
          ...state,
          ...computedValues,
          selectedMonth: state.selectedMonth,
          language: state.language,
          totalSpent,
          totalBudget,
          savingsRate,
          currentMonthExpenses,
          userName: state.userName
        },
        translations: t
      };
      
      const html = await ReportGenerator.generateHTML(reportData);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (error) {
      console.error('Erreur génération aperçu:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      // Calculer les données nécessaires pour le rapport
      const currentMonthExpenses = state.expenses.filter(e => 
        e.date.startsWith(state.selectedMonth)
      );
      
      const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalBudget = state.categories.reduce((sum, cat) => sum + cat.budget, 0);
      const savingsRate = state.monthlyIncome > 0 ? ((state.monthlyIncome - totalSpent) / state.monthlyIncome) * 100 : 0;
      
      const reportData = {
        type: selectedReport,
        data: {
          ...state,
          ...computedValues,
          selectedMonth: state.selectedMonth,
          language: state.language,
          totalSpent,
          totalBudget,
          savingsRate,
          currentMonthExpenses,
          userName: state.userName
        },
        translations: t
      };

      if (selectedFormat === 'html') {
        await ReportGenerator.exportHTML(reportData);
      } else {
        await ReportGenerator.exportPDF(reportData);
      }
      
      showNotification(t('exportSuccess'), 'success');
    } catch (error) {
      console.error('Erreur export:', error);
      showNotification(t('exportError'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (showPreview) {
    return (
      <Modal
        isOpen={state.modals.import}
        onClose={() => {
          setShowPreview(false);
          actions.toggleModal('import', false);
        }}
        title={t('reportPreview')}
        maxWidth="max-w-6xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setShowPreview(false)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Icons.ArrowLeft className="h-4 w-4" />
              <span>{t('back')}</span>
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={handleExport}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                <Icons.Download className="h-4 w-4" />
                <span>{selectedFormat === 'html' ? 'HTML' : 'PDF'}</span>
              </Button>
            </div>
          </div>
          
          <div 
            className="border rounded-lg p-4 max-h-96 overflow-auto bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={state.modals.import}
      onClose={() => actions.toggleModal('import', false)}
      title={t('exportReports')}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Sélection du type de rapport */}
        <div>
          <h4 className={`font-medium ${theme.text} mb-3`}>{t('selectReportType')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportTypes.map((report) => {
              const IconComponent = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className={`h-5 w-5 mt-0.5 ${
                      selectedReport === report.id ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <div>
                      <div className={`font-medium ${theme.text}`}>
                        {report.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {report.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sélection du format */}
        <div>
          <h4 className={`font-medium ${theme.text} mb-3`}>{t('selectFormat')}</h4>
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedFormat('html')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                selectedFormat === 'html'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icons.Globe className="h-4 w-4" />
              <span>HTML</span>
            </button>
            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                selectedFormat === 'pdf'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icons.FileText className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between space-x-3">
          <Button
            onClick={handlePreview}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Icons.Eye className="h-4 w-4" />
            <span>{t('preview')}</span>
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            {isGenerating ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Download className="h-4 w-4" />
            )}
            <span>{t('export')}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default ExportModal; 