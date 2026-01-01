import React, { useState, useEffect, useRef } from 'react';
import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, EncoderMapping, MidiType, IrProtocol, GeneratorConfig, MultiplexerConfig, MuxFaderMapping } from './types';
import { generateArduinoCode } from './services/codeGenerator';
import { generateVdjXml } from './services/vdjGenerator';
import MappingRow from './components/MappingRow';
import ButtonRow from './components/ButtonRow';
import FaderRow from './components/FaderRow';
import KeypadRow from './components/KeypadRow';
import EncoderRow from './components/EncoderRow';
import DisplayView from './components/DisplayView';
import MuxView from './components/MuxView';
import Assistant from './components/Assistant';
import { Plus, Download, Copy, Code2, Cpu, Settings, Bot, Radio, CircleDot, Sliders, Grid3X3, FileCode, RotateCw, Monitor, Layers, Unplug, Plug } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<GeneratorConfig>({
    irPin: 15,
    useLedFeedback: true,
    controllerName: 'MyRP2040Controller',
    display: {
      enabled: false,
      type: 'SH1106',
      isDual: false,
      sdaPin: 4,
      sclPin: 5,
      i2cAddress: '0x3C',
      sda2Pin: 6,
      scl2Pin: 7,
      i2cAddress2: '0x3D',
      showIrLog: true,
      showMidiLog: true,
      inverted: false,
      deckMode: true
    }
  });

  const [mappings, setMappings] = useState<Mapping[]>([
    { id: '1', irCode: '0x45', irProtocol: IrProtocol.NEC, midiType: MidiType.NOTE_ON, channel: 1, data1: 60, data2: 127, vdjAction: 'play_pause' },
  ]);
  const [buttons, setButtons] = useState<ButtonMapping[]>([]);
  const [faders, setFaders] = useState<FaderMapping[]>([]);
  const [encoders, setEncoders] = useState<EncoderMapping[]>([]);
  const [keypads, setKeypads] = useState<KeypadMapping[]>([]);
  const [muxes, setMuxes] = useState<MultiplexerConfig[]>([]);
  const [muxFaders, setMuxFaders] = useState<MuxFaderMapping[]>([]);

  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedXml, setGeneratedXml] = useState('');
  const [activeView, setActiveView] = useState<'ir' | 'buttons' | 'faders' | 'encoders' | 'keypad' | 'display' | 'mux'>('ir');
  const [activeRightTab, setActiveRightTab] = useState<'code' | 'xml' | 'assistant'>('code');
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [learningId, setLearningId] = useState<string | null>(null);

  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const keepReadingRef = useRef(false);

  useEffect(() => {
    const code = generateArduinoCode(mappings, buttons, faders, keypads, config, encoders, muxes, muxFaders);
    const xml = generateVdjXml(mappings, buttons, faders, keypads, config, encoders, muxFaders);
    setGeneratedCode(code);
    setGeneratedXml(xml);
  }, [mappings, buttons, faders, keypads, encoders, config, muxes, muxFaders]);

  const connectSerial = async () => {
    if (!('serial' in navigator)) return;
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setIsSerialConnected(true);
      // Serial reading logic would go here
    } catch (err) { console.error(err); }
  };

  const disconnectSerial = async () => {
    keepReadingRef.current = false;
    if (readerRef.current) await readerRef.current.cancel();
    if (portRef.current) await portRef.current.close();
    setIsSerialConnected(false);
    setLearningId(null);
  };

  const handleAddItem = () => {
    const id = Date.now().toString();
    switch (activeView) {
      case 'ir':
        setMappings([...mappings, { id, irCode: '', irProtocol: IrProtocol.NEC, midiType: MidiType.NOTE_ON, channel: 1, data1: 60, data2: 127 }]);
        break;
      case 'buttons':
        setButtons([...buttons, { id, name: `Button ${buttons.length + 1}`, pin: 0, midiType: MidiType.NOTE_ON, channel: 1, data1: 60 }]);
        break;
      case 'faders':
        setFaders([...faders, { id, name: `Fader ${faders.length + 1}`, pin: 26, channel: 1, ccNumber: 20 + faders.length }]);
        break;
      case 'encoders':
        setEncoders([...encoders, { id, name: `Encoder ${encoders.length + 1}`, pinA: 10, pinB: 11, midiType: MidiType.CC, channel: 1, ccNumber: 30 + encoders.length, multiplier: 1 }]);
        break;
      case 'keypad':
        setKeypads([...keypads, { id, name: `Keypad ${keypads.length + 1}`, mode: MidiType.NOTE_ON, channel: 1, rowPins: [2, 3, 4, 5], colPins: [6, 7, 8, 9], values: Array(4).fill(0).map(() => Array(4).fill(36)) }]);
        break;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans overflow-hidden">
      <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-gray-800 bg-gray-900">
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400"><Cpu /> RP2040 Controller</h1>
          <p className="text-xs text-gray-500 mt-1">Advanced MIDI Architect</p>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-gray-900/40">
           <div>
            <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2"><Settings size={14} /> Global Settings</h2>
            <div className="space-y-4">
              <input type="text" value={config.controllerName} onChange={(e) => setConfig({...config, controllerName: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="Controller Name"/>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">IR Receiver Pin</label>
                <input type="number" value={config.irPin} onChange={(e) => setConfig({...config, irPin: parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"/>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md">
          <nav className="flex bg-gray-800/80 rounded-xl p-1 gap-1 border border-gray-700">
            <button onClick={() => setActiveView('ir')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${activeView === 'ir' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><Radio size={14}/>IR</button>
            <button onClick={() => setActiveView('mux')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${activeView === 'mux' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><Layers size={14}/>Multiplexer</button>
            <button onClick={() => setActiveView('buttons')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${activeView === 'buttons' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><CircleDot size={14}/>Buttons</button>
            <button onClick={() => setActiveView('faders')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${activeView === 'faders' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><Sliders size={14}/>Fader</button>
            <button onClick={() => setActiveView('encoders')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${activeView === 'encoders' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><RotateCw size={14}/>Encoder</button>
            <button onClick={() => setActiveView('keypad')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${activeView === 'keypad' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><Grid3X3 size={14}/>Keypad</button>
            <button onClick={() => setActiveView('display')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${activeView === 'display' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><Monitor size={14}/>Display</button>
          </nav>

          <div className="flex items-center gap-3">
            {activeView === 'ir' && (
              !isSerialConnected ? (
                <button onClick={connectSerial} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                  <Unplug size={14} /> Verbinden
                </button>
              ) : (
                <button onClick={disconnectSerial} className="flex items-center gap-2 bg-green-900/30 border border-green-800 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                  <Plug size={14} /> Verbunden
                </button>
              )
            )}

            {['ir', 'buttons', 'faders', 'encoders', 'keypad'].includes(activeView) && (
              <button 
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
              >
                <Plus size={14} /> Hinzufügen
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 bg-[#0a0c10] scrollbar-thin scrollbar-thumb-gray-800">
            {activeView === 'ir' && mappings.map(m => <MappingRow key={m.id} mapping={m} isLearning={learningId===m.id} onLearn={id => setLearningId(id)} onChange={(id,f,v)=>setMappings(mappings.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setMappings(mappings.filter(x=>x.id!==id))}/>)}
            {activeView === 'mux' && <MuxView muxes={muxes} faders={muxFaders} onMuxChange={setMuxes} onFaderChange={setMuxFaders} />}
            {activeView === 'buttons' && buttons.map(b => <ButtonRow key={b.id} mapping={b} onChange={(id,f,v)=>setButtons(buttons.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setButtons(buttons.filter(x=>x.id!==id))}/>)}
            {activeView === 'faders' && faders.map(f => <FaderRow key={f.id} mapping={f} onChange={(id,f,v)=>setFaders(faders.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setFaders(faders.filter(x=>x.id!==id))}/>)}
            {activeView === 'encoders' && encoders.map(e => <EncoderRow key={e.id} mapping={e} onChange={(id,f,v)=>setEncoders(encoders.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setEncoders(encoders.filter(x=>x.id!==id))}/>)}
            {activeView === 'keypad' && keypads.map(k => <KeypadRow key={k.id} mapping={k} onChange={(id,f,v)=>setKeypads(keypads.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setKeypads(keypads.filter(x=>x.id!==id))}/>)}
            {activeView === 'display' && <DisplayView config={config.display} onChange={(f,v) => setConfig({...config, display: {...config.display, [f]: v}})} />}
          </div>

          <div className="w-[450px] border-l border-gray-800 bg-gray-900 flex flex-col shadow-2xl">
            <div className="flex border-b border-gray-800">
              <button onClick={() => setActiveRightTab('code')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeRightTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/20' : 'text-gray-500 hover:text-gray-300'}`}>Arduino</button>
              <button onClick={() => setActiveRightTab('xml')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeRightTab === 'xml' ? 'text-orange-400 border-b-2 border-orange-400 bg-gray-800/20' : 'text-gray-500 hover:text-gray-300'}`}>VirtualDJ</button>
              <button onClick={() => setActiveRightTab('assistant')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeRightTab === 'assistant' ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/20' : 'text-gray-500 hover:text-gray-300'}`}>AI Hilfe</button>
            </div>
            <div className="flex-1 overflow-auto bg-[#1e1e1e] relative">
               {activeRightTab === 'assistant' ? <Assistant currentCode={generatedCode} /> : (
                 <div className="h-full flex flex-col">
                    <pre className="p-4 text-[10px] text-gray-400 font-mono leading-relaxed flex-1">{activeRightTab === 'xml' ? generatedXml : generatedCode}</pre>
                    <div className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2">
                      <button onClick={() => {
                        navigator.clipboard.writeText(activeRightTab === 'xml' ? generatedXml : generatedCode);
                        alert('Kopiert!');
                      }} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2 rounded text-xs">
                        <Copy size={14} /> Kopieren
                      </button>
                      <button onClick={() => {
                        const blob = new Blob([activeRightTab === 'xml' ? generatedXml : generatedCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${config.controllerName}.${activeRightTab === 'xml' ? 'xml' : 'ino'}`;
                        a.click();
                      }} className={`flex-1 flex items-center justify-center gap-2 text-white py-2 rounded text-xs ${activeRightTab === 'xml' ? 'bg-orange-700 hover:bg-orange-600' : 'bg-blue-700 hover:bg-blue-600'}`}>
                        <Download size={14} /> Download
                      </button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;