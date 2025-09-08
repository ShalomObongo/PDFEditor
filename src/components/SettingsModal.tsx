'use client';

import React, { useState } from 'react';
import { Settings, X, Save, RotateCcw } from 'lucide-react';

export interface AppSettings {
  defaultZoom: number;
  defaultTool: string;
  defaultColor: string;
  autoSave: boolean;
  showGridLines: boolean;
  snapToGrid: boolean;
  darkMode: boolean;
  maxHistoryStates: number;
  defaultFontSize: number;
  defaultFontFamily: string;
  exportQuality: 'low' | 'medium' | 'high';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  defaultZoom: 1,
  defaultTool: 'select',
  defaultColor: '#ff0000',
  autoSave: false,
  showGridLines: false,
  snapToGrid: false,
  darkMode: false,
  maxHistoryStates: 50,
  defaultFontSize: 16,
  defaultFontFamily: 'Arial',
  exportQuality: 'high'
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Default Tool Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Default Tool Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Zoom Level
                </label>
                <select
                  value={localSettings.defaultZoom}
                  onChange={(e) => updateSetting('defaultZoom', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value={0.5}>50%</option>
                  <option value={0.75}>75%</option>
                  <option value={1}>100%</option>
                  <option value={1.25}>125%</option>
                  <option value={1.5}>150%</option>
                  <option value={2}>200%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Tool
                </label>
                <select
                  value={localSettings.defaultTool}
                  onChange={(e) => updateSetting('defaultTool', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="select">Select</option>
                  <option value="text">Text</option>
                  <option value="highlight">Highlight</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="circle">Circle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Color
                </label>
                <input
                  type="color"
                  value={localSettings.defaultColor}
                  onChange={(e) => updateSetting('defaultColor', e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Text Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Text Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Font Size
                </label>
                <select
                  value={localSettings.defaultFontSize}
                  onChange={(e) => updateSetting('defaultFontSize', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value={10}>10px</option>
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                  <option value={32}>32px</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Font Family
                </label>
                <select
                  value={localSettings.defaultFontFamily}
                  onChange={(e) => updateSetting('defaultFontFamily', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
            </div>
          </div>

          {/* Application Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Application Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Auto-save changes</label>
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Show grid lines</label>
                <input
                  type="checkbox"
                  checked={localSettings.showGridLines}
                  onChange={(e) => updateSetting('showGridLines', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Snap to grid</label>
                <input
                  type="checkbox"
                  checked={localSettings.snapToGrid}
                  onChange={(e) => updateSetting('snapToGrid', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maximum History States ({localSettings.maxHistoryStates})
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={localSettings.maxHistoryStates}
                  onChange={(e) => updateSetting('maxHistoryStates', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Export Quality
                </label>
                <select
                  value={localSettings.exportQuality}
                  onChange={(e) => updateSetting('exportQuality', e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="low">Low (faster, smaller file)</option>
                  <option value="medium">Medium (balanced)</option>
                  <option value="high">High (slower, larger file)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
export { defaultSettings };
