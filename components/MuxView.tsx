import React from 'react';
import { MultiplexerConfig, MuxFaderMapping, MidiType } from '../types';
import { Layers, Plus, Trash2, Cpu, Hash, CircleDot, SlidersHorizontal } from 'lucide-react';
import VdjActionInput from './VdjActionInput';

interface Props {
  muxes: MultiplexerConfig[];
  faders: MuxFaderMapping[];
  onMuxChange: (muxes: MultiplexerConfig[]) => void;
  onFaderChange: (faders: MuxFaderMapping[]) => void;
}

const MuxView: React.FC<Props> = ({ muxes, faders, onMuxChange, onFaderChange }) => {
  const generateSafeId = () => Math.random().toString(36).substring(2, 9);

  const addMux = () => {
    const newMux: MultiplexerConfig = {
      id: generateSafeId(),
      name: `Multiplexer ${muxes.length + 1}`,
      type: '16',
      addressPins: [2, 3, 4, 5],
      signalPin: 26
    };
    onMuxChange([...muxes, newMux]);
  };

  const addChannel = (muxId: string) => {
    const channel = faders.filter(f => f.muxId === muxId).length;
    if (channel >= 16) return;
    const newFader: MuxFaderMapping = {
      id: generateSafeId(),
      muxId,
      channelIndex: channel,
      mode: 'analog',
      midiType: MidiType.CC,
      midiChannel: 1,
      ccNumber: 20 + channel,
      vdjAction: ''
    };
    onFaderChange([...faders, newFader]);
  };

  const updateMux = (id: string, field: keyof MultiplexerConfig, value: any) => {
    onMuxChange(muxes.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const updateFader = (id: string, field: keyof MuxFaderMapping, value: any) => {
    onFaderChange(faders.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
          <Layers size={24} /> Multiplexer (ADC & Digital Expansion)
        </h2>
        <button onClick={addMux} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg transition-all">
          <Plus size={18} /> MUX hinzufügen
        </button>
      </div>

      {muxes.map(mux => (
        <div key={mux.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl mb-6">
          {/* Hardware Header */}
          <div className="bg-gray-900/80 p-4 border-b border-gray-700 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Cpu className="text-blue-500" size={20} />
              <input 
                type="text" value={mux.name} onChange={e => updateMux(mux.id, 'name', e.target.value)}
                className="bg-transparent border-b border-gray-700 focus:border-blue-500 outline-none font-bold text-white text-sm w-40"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Typ:</span>
              <select value={mux.type} onChange={e => updateMux(mux.id, 'type', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
                <option value="8">8 Kanäle (4051)</option>
                <option value="16">16 Kanäle (4067)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Z-Pin:</span>
              <input 
                type="number" value={mux.signalPin} onChange={e => updateMux(mux.id, 'signalPin', parseInt(e.target.value))}
                className="w-12 bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-center text-orange-400 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
               <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">S0-S3 Pins:</span>
               <div className="flex gap-1">
                 {mux.addressPins.map((pin, i) => (
                   <input key={i} type="number" value={pin} 
                    onChange={e => {
                      const newPins = [...mux.addressPins];
                      newPins[i] = parseInt(e.target.value);
                      updateMux(mux.id, 'addressPins', newPins);
                    }}
                    className="w-10 bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-center font-mono text-blue-300"
                   />
                 ))}
               </div>
            </div>

            <button onClick={() => onMuxChange(muxes.filter(m => m.id !== mux.id))} className="ml-auto text-gray-500 hover:text-red-500 p-2">
              <Trash2 size={18} />
            </button>
          </div>

          {/* Channels List */}
          <div className="p-4 space-y-2">
            {faders.filter(f => f.muxId === mux.id).sort((a,b) => a.channelIndex - b.channelIndex).map(chan => (
              <div key={chan.id} className="grid grid-cols-12 gap-2 items-center bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 hover:border-blue-500/30 transition-all group">
                <div className="col-span-1 flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Hash size={12} className="text-gray-600" />
                  {chan.channelIndex}
                </div>
                
                {/* Mode Switcher */}
                <div className="col-span-2">
                  <div className="flex bg-black/40 rounded p-0.5 border border-gray-800">
                    <button 
                      onClick={() => updateFader(chan.id, 'mode', 'analog')}
                      className={`flex-1 flex justify-center py-1 rounded transition-all ${chan.mode === 'analog' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
                      title="Analog (Potentiometer)"
                    >
                      <SlidersHorizontal size={12} />
                    </button>
                    <button 
                      onClick={() => updateFader(chan.id, 'mode', 'digital')}
                      className={`flex-1 flex justify-center py-1 rounded transition-all ${chan.mode === 'digital' ? 'bg-green-600 text-white shadow' : 'text-gray-500'}`}
                      title="Digital (Button)"
                    >
                      <CircleDot size={12} />
                    </button>
                  </div>
                </div>

                <div className="col-span-1">
                  <input type="number" value={chan.midiChannel} onChange={e => updateFader(chan.id, 'midiChannel', parseInt(e.target.value))} className="w-full bg-black/40 border border-gray-800 rounded px-1 py-1 text-xs text-center text-white"/>
                </div>

                <div className="col-span-2 flex gap-1">
                  {chan.mode === 'digital' && (
                    <select 
                      value={chan.midiType} 
                      onChange={e => updateFader(chan.id, 'midiType', e.target.value)}
                      className="bg-black/40 border border-gray-800 rounded px-1 py-1 text-[10px] text-gray-400"
                    >
                      <option value={MidiType.NOTE_ON}>Note</option>
                      <option value={MidiType.CC}>CC</option>
                    </select>
                  )}
                  <input 
                    type="number" 
                    value={chan.ccNumber} 
                    onChange={e => updateFader(chan.id, 'ccNumber', parseInt(e.target.value))} 
                    className={`w-full bg-black/40 border border-gray-800 rounded px-1 py-1 text-xs text-center font-mono ${chan.mode === 'analog' ? 'text-orange-400' : 'text-green-400'}`}
                    placeholder={chan.mode === 'analog' ? 'CC' : 'Note/CC'}
                  />
                </div>

                <div className="col-span-5">
                  <VdjActionInput value={chan.vdjAction || ''} onChange={val => updateFader(chan.id, 'vdjAction', val)} placeholder="Action..." className="w-full bg-black/40 border border-gray-800 rounded px-3 py-1 text-xs text-blue-200 outline-none focus:border-blue-500"/>
                </div>

                <div className="col-span-1 flex justify-end">
                  <button onClick={() => onFaderChange(faders.filter(f => f.id !== chan.id))} className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => addChannel(mux.id)} className="w-full mt-2 py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:border-blue-500/50 hover:text-blue-400 text-xs font-bold transition-all flex items-center justify-center gap-2">
              <Plus size={14} /> Kanal hinzufügen
            </button>
          </div>
        </div>
      ))}

      {muxes.length === 0 && (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
           <Layers className="mx-auto text-gray-700 mb-4" size={48} />
           <h3 className="text-gray-400 font-bold">Keine Multiplexer konfiguriert</h3>
           <p className="text-gray-600 text-xs mt-2 max-w-xs mx-auto">Verwende Multiplexer um bis zu 16 analoge oder digitale Eingänge über nur einen Pin am RP2040 zu lesen.</p>
        </div>
      )}
    </div>
  );
};

export default MuxView;