import React from 'react';
import { DisplaySettings, DisplayType } from '../types';
import { Monitor, CheckCircle2, Circle, Layout, Laptop, Cpu, Layers } from 'lucide-react';

interface Props {
  config: DisplaySettings;
  onChange: (field: keyof DisplaySettings, value: any) => void;
}

const DisplayView: React.FC<Props> = ({ config, onChange }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
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
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${config.enabled ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-gray-700 text-gray-400'}`}
          >
            {config.enabled ? 'Aktiviert' : 'Deaktiviert'}
          </button>
        </div>

        <div className={`space-y-6 ${!config.enabled && 'opacity-50 pointer-events-none'}`}>
          {/* Dual Display Toggle */}
          <button 
            onClick={() => onChange('isDual', !config.isDual)}
            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${config.isDual ? 'bg-blue-900/20 border-blue-500 text-blue-100' : 'bg-gray-900 border-gray-700 text-gray-500'}`}
          >
            <div className="flex items-center gap-3">
              <Layers size={20} className={config.isDual ? 'text-blue-400' : 'text-gray-600'} />
              <div className="text-left">
                <div className="text-sm font-bold uppercase tracking-wider">Dual Display Modus</div>
                <div className="text-[10px] opacity-70">Ein separates Display für Deck 1 und Deck 2 vorsehen</div>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${config.isDual ? 'bg-blue-600' : 'bg-gray-700'}`}>
               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.isDual ? 'right-1' : 'left-1'}`} />
            </div>
          </button>

          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <label className="text-xs text-gray-500 block mb-3 uppercase tracking-widest text-[10px]">Hardware Typ (Gilt für alle Displays)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['SH1106', 'SSD1306', 'LCD1602'] as DisplayType[]).map(t => (
                <button 
                  key={t}
                  onClick={() => onChange('type', t)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-md border transition-all ${config.type === t ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                >
                  {t === 'LCD1602' ? <Monitor size={20} /> : t === 'SSD1306' ? <Cpu size={20} /> : <Laptop size={20} />}
                  <span className="text-xs font-bold">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display 1 (Deck 1) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest border-b border-blue-900/30 pb-1">Deck 1 Display</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <label className="text-[9px] text-gray-500 block mb-1 uppercase">SDA Pin</label>
                  <input type="number" value={config.sdaPin} onChange={e => onChange('sdaPin', parseInt(e.target.value))} className="w-full bg-transparent outline-none text-sm font-mono text-blue-300"/>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <label className="text-[9px] text-gray-500 block mb-1 uppercase">SCL Pin</label>
                  <input type="number" value={config.sclPin} onChange={e => onChange('sclPin', parseInt(e.target.value))} className="w-full bg-transparent outline-none text-sm font-mono text-blue-300"/>
                </div>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                <label className="text-[9px] text-gray-500 block mb-1 uppercase">I2C Adresse</label>
                <input type="text" value={config.i2cAddress} onChange={e => onChange('i2cAddress', e.target.value)} className="w-full bg-transparent outline-none text-sm font-mono text-blue-300"/>
              </div>
            </div>

            {/* Display 2 (Deck 2) */}
            {config.isDual && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest border-b border-purple-900/30 pb-1">Deck 2 Display</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <label className="text-[9px] text-gray-500 block mb-1 uppercase">SDA Pin</label>
                    <input type="number" value={config.sda2Pin} onChange={e => onChange('sda2Pin', parseInt(e.target.value))} className="w-full bg-transparent outline-none text-sm font-mono text-purple-300"/>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <label className="text-[9px] text-gray-500 block mb-1 uppercase">SCL Pin</label>
                    <input type="number" value={config.scl2Pin} onChange={e => onChange('scl2Pin', parseInt(e.target.value))} className="w-full bg-transparent outline-none text-sm font-mono text-purple-300"/>
                  </div>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <label className="text-[9px] text-gray-500 block mb-1 uppercase">I2C Adresse</label>
                  <input type="text" value={config.i2cAddress2} onChange={e => onChange('i2cAddress2', e.target.value)} className="w-full bg-transparent outline-none text-sm font-mono text-purple-300"/>
                </div>
              </div>
            )}
          </div>

          {!config.isDual && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Single Display Layout</h4>
              <button 
                onClick={() => onChange('deckMode', !config.deckMode)} 
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${config.deckMode ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
              >
                <div className="flex items-center gap-2">
                  <Layout size={16} />
                  <div className="text-left">
                    <div className="text-sm font-bold">Split-Screen Modus</div>
                    <div className="text-[10px] opacity-70">Beide Decks auf einem Schirm anzeigen</div>
                  </div>
                </div>
                {config.deckMode ? <CheckCircle2 className="text-blue-400" size={18}/> : <Circle className="text-gray-700" size={18}/>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
        <h5 className="text-blue-400 font-bold text-xs mb-2 uppercase flex items-center gap-2">
          <Monitor size={14} /> RP2040 I2C Tipp
        </h5>
        <div className="text-[11px] text-blue-200/70 leading-relaxed">
          Für Dual-Display Betrieb kannst du entweder <strong>beide Displays an denselben Bus</strong> hängen (nutze unterschiedliche I2C-Adressen, z.B. 0x3C und 0x3D) oder <strong>zwei separate Busse</strong> nutzen:
          <br/><br/>
          Bus 0 (I2C0): SDA=4, SCL=5<br/>
          Bus 1 (I2C1): SDA=6, SCL=7 (oder 2, 3 etc.)
        </div>
      </div>
    </div>
  );
};
export default DisplayView;