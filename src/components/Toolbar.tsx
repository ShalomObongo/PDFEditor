'use client';

import React from 'react';
import { 
  Type, 
  Highlighter, 
  Square, 
  Circle, 
  MousePointer
} from 'lucide-react';

export interface Tool {
  type: 'select' | 'text' | 'highlight' | 'rectangle' | 'circle';
  color: string;
}

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolChange }) => {
  const tools: Array<{ 
    type: Tool['type']; 
    icon: React.ComponentType<{ className?: string; size?: number }>; 
    label: string; 
    description: string;
  }> = [
    { type: 'select', icon: MousePointer, label: 'Select', description: 'Select and move annotations' },
    { type: 'text', icon: Type, label: 'Text', description: 'Add text annotations' },
    { type: 'highlight', icon: Highlighter, label: 'Highlight', description: 'Highlight text areas' },
    { type: 'rectangle', icon: Square, label: 'Rectangle', description: 'Draw rectangles' },
    { type: 'circle', icon: Circle, label: 'Circle', description: 'Draw circles' },
  ];

  const colors = [
    { value: '#ff0000', name: 'Red' },
    { value: '#00ff00', name: 'Green' },
    { value: '#0000ff', name: 'Blue' },
    { value: '#ffff00', name: 'Yellow' },
    { value: '#ff00ff', name: 'Magenta' },
    { value: '#00ffff', name: 'Cyan' },
    { value: '#000000', name: 'Black' },
    { value: '#ffa500', name: 'Orange' },
    { value: '#800080', name: 'Purple' },
    { value: '#008000', name: 'Dark Green' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 min-w-[240px]">
      {/* Tools Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tools</h3>
        <div className="space-y-2">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => onToolChange({ ...activeTool, type: tool.type })}
              className={`
                w-full p-3 rounded-lg text-left border-2 transition-all duration-200
                flex items-center space-x-3 group
                ${activeTool.type === tool.type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              title={tool.description}
            >
              <tool.icon className={`
                w-5 h-5 transition-colors
                ${activeTool.type === tool.type 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                }
              `} />
              <div className="flex-1">
                <span className={`
                  text-sm font-medium transition-colors
                  ${activeTool.type === tool.type 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 dark:text-gray-200'
                  }
                `}>
                  {tool.label}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {tool.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Colors Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Colors</h3>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => onToolChange({ ...activeTool, color: color.value })}
              className={`
                w-10 h-10 rounded-lg border-2 transition-all duration-200
                hover:scale-105 hover:shadow-md
                ${activeTool.color === color.value 
                  ? 'border-gray-800 dark:border-gray-200 shadow-lg scale-105' 
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        
        {/* Custom Color Input */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Color
          </label>
          <input
            type="color"
            value={activeTool.color}
            onChange={(e) => onToolChange({ ...activeTool, color: e.target.value })}
            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Tool Settings */}
      {activeTool.type === 'text' && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Text Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Size
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16" defaultChecked>16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Family
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
