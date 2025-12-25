import React from 'react';
import { DisplaySettings, DisplayType } from '../types';
import { Monitor, CheckCircle2, Circle, Layout, Laptop } from 'lucide-react';

interface Props {
  config: DisplaySettings;
  onChange: (field: keyof DisplaySettings, value: any) => void;
}

const DisplayView: React.FC<Props> = ({ config, onChange }) => {
  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Monitor className="text-blue-400" size={24} />
            <div>
              <h3 className="font-bold text-lg">Display Konfiguration</h3>
              <p className="text-xs text-gray-400">Feedback für IR & MIDI Status</p>
            </div>
          </div>
          <button 
            onClick={() => onChange('enabled', !config.enabled)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${config.enabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            {config.enabled ? 'Aktiviert' : 'Deaktiviert'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <label className="text-xs text-gray-500 block mb-3 uppercase tracking-widest text-[10px]">Hardware Typ</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onChange('type', 'SH1106')}
                className={`flex flex-col items-center gap-2 p-3 rounded-md border transition-all ${config.type === 'SH1106' ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
              >
                <Laptop size={20} />
                <span className="text-xs font-bold">SH1106 OLED</span>
              </button>
              <button 
                onClick={() => onChange('type', 'LCD1602')}
                className={`flex flex-col items-center gap-2 p-3 rounded-md border transition-all ${config.type === 'LCD1602' ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
              >
                <Monitor size={20} />
                <span className="text-xs font-bold">LCD1602 (I2C)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
               <label className="text-xs text-gray-500 block mb-2 uppercase tracking-widest text-[10px]">I2C Adresse</label>
               <select 
                value={config.i2cAddress} 
                onChange={e => onChange('i2cAddress', e.target.value)}
                className="w-full bg-transparent outline-none font-mono text-sm"
               >
                 <option value="0x3C">0x3C (OLED Standard)</option>
                 <option value="0x27">0x27 (LCD Standard)</option>
                 <option value="0x3D">0x3D</option>
                 <option value="0x3F">0x3F</option>
               </select>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
               <span className="text-xs text-gray-500 uppercase tracking-widest text-[10px]">Invertieren / Backlight</span>
               <input type="checkbox" checked={config.inverted} onChange={e => onChange('inverted', e.target.checked)} className="w-5 h-5 rounded bg-gray-800 border-gray-700"/>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Layout & Modus</h4>
            <div className="space-y-2">
              <button 
                onClick={() => onChange('deckMode', !config.deckMode)} 
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${config.deckMode ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
              >
                <div className="flex items-center gap-2">
                  <Layout size={16} />
                  <div className="text-left">
                    <div className="text-sm font-bold">DJ Deck Split-Modus</div>
                    <div className="text-[10px] opacity-70">
                      {config.type === 'SH1106' ? 'Horizontaler Split' : 'Zeile 1: Deck 1 | Zeile 2: Deck 2'}
                    </div>
                  </div>
                </div>
                {config.deckMode ? <CheckCircle2 className="text-blue-400" size={18}/> : <Circle className="text-gray-700" size={18}/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-orange-900/10 border border-orange-900/30 rounded-lg">
        <h5 className="text-orange-400 font-bold text-xs mb-2 uppercase flex items-center gap-2">
          <Monitor size={14} /> Hardware Hinweis
        </h5>
        <p className="text-[11px] text-orange-200/70 leading-relaxed">
          {config.type === 'SH1106' 
            ? 'Das SH1106 OLED benötigt die U8g2 Bibliothek. Ideal für detaillierte Grafiken.' 
            : 'Das LCD1602 benötigt die LiquidCrystal_I2C Bibliothek. Klassischer Look, sehr robust.'}
          <br/><br/>
          Verbindung: <strong>SDA (GPIO 4)</strong> und <strong>SCL (GPIO 5)</strong> für Hardware-I2C am Pico.
        </p>
      </div>
    </div>
  );
};
export default DisplayView;