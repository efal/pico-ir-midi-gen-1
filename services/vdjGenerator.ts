import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, EncoderMapping, MidiType, GeneratorConfig, MuxFaderMapping } from '../types';

export const generateVdjXml = (
  irMappings: Mapping[], 
  buttons: ButtonMapping[], 
  faders: FaderMapping[], 
  keypads: KeypadMapping[],
  config: GeneratorConfig,
  encoders: EncoderMapping[] = [],
  muxFaders: MuxFaderMapping[] = []
): string => {
  const toHex = (num: number) => num.toString(16).toUpperCase().padStart(2, '0');
  const getStatusByte = (type: MidiType, channel: number): string => {
    const ch = channel - 1;
    let base = 0x90; 
    if (type === MidiType.CC) base = 0xB0;
    return toHex(base + ch);
  };

  let xmlLines: string[] = [];

  // Mux Channels (Analog & Digital)
  if (muxFaders.length > 0) {
    xmlLines.push(`    <!-- Multiplexer Channels -->`);
    muxFaders.forEach(mf => {
      const mtype = mf.mode === 'analog' ? MidiType.CC : mf.midiType;
      const status = getStatusByte(mtype, mf.midiChannel);
      xmlLines.push(`    <map value="${status} ${toHex(mf.ccNumber)}" action="${mf.vdjAction || ''}" />`);
    });
  }

  // Faders
  if (faders.length > 0) {
    xmlLines.push(`    <!-- Direct Faders & Pots -->`);
    faders.forEach(f => {
      const status = getStatusByte(MidiType.CC, f.channel);
      xmlLines.push(`    <map value="${status} ${toHex(f.ccNumber)}" action="${f.vdjAction || ''}" />`);
    });
  }

  // IR Mappings
  if (irMappings.length > 0) {
    xmlLines.push(`    <!-- IR Remote Mappings -->`);
    irMappings.forEach(m => {
      const status = getStatusByte(m.midiType, m.channel);
      xmlLines.push(`    <map value="${status} ${toHex(m.data1)}" action="${m.vdjAction || ''}" />`);
    });
  }

  // Buttons
  if (buttons.length > 0) {
    xmlLines.push(`    <!-- Direct Buttons -->`);
    buttons.forEach(b => {
      const status = getStatusByte(b.midiType as any, b.channel);
      xmlLines.push(`    <map value="${status} ${toHex(b.data1)}" action="${b.vdjAction || ''}" />`);
    });
  }

  // Encoders
  if (encoders.length > 0) {
    xmlLines.push(`    <!-- Encoders -->`);
    encoders.forEach(e => {
      const status = getStatusByte(e.midiType || MidiType.CC, e.channel);
      xmlLines.push(`    <map value="${status} ${toHex(e.ccNumber)}" action="${e.vdjActionRotate || ''}" />`);
      if (e.pinButton !== undefined) {
        const btnStatus = getStatusByte(e.buttonMidiType as any || MidiType.NOTE_ON, e.channel);
        xmlLines.push(`    <map value="${btnStatus} ${toHex(e.buttonData1 || 60)}" action="${e.vdjActionClick || ''}" />`);
      }
    });
  }

  // Keypads
  if (keypads.length > 0) {
    xmlLines.push(`    <!-- Keypad Matrix -->`);
    keypads.forEach(k => {
      const status = getStatusByte(k.mode, k.channel);
      k.values.forEach((row, rIdx) => {
        row.forEach((val, cIdx) => {
          const action = (k.vdjActions && k.vdjActions[rIdx] && k.vdjActions[rIdx][cIdx]) || '';
          xmlLines.push(`    <map value="${status} ${toHex(val)}" action="${action}" />`);
        });
      });
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mapper device="${config.controllerName}" author="GeneratedByTool" version="1.0">
  <info><name>${config.controllerName}</name></info>
  <mapping>
${xmlLines.join('\n')}
  </mapping>
</mapper>`;
};