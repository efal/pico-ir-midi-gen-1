import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, EncoderMapping, MidiType, IrProtocol, GeneratorConfig, MultiplexerConfig, MuxFaderMapping } from '../types';

export const generateArduinoCode = (
  irMappings: Mapping[], 
  buttons: ButtonMapping[], 
  faders: FaderMapping[], 
  keypads: KeypadMapping[],
  config: GeneratorConfig,
  encoders: EncoderMapping[] = [],
  muxes: MultiplexerConfig[] = [],
  muxFaders: MuxFaderMapping[] = []
): string => {
  const timestamp = new Date().toLocaleString('de-DE');

  // Helper to make IDs safe for C++ variable names (no dots, starts with letter)
  const safeId = (id: string) => {
    const clean = id.replace(/[^a-zA-Z0-9]/g, '_');
    return /^[0-9]/.test(clean) ? `v${clean}` : clean;
  };

  const formatHex = (hex: string) => {
    const clean = hex.trim();
    if (!clean) return null;
    return clean.startsWith('0x') || clean.startsWith('0X') ? clean : `0x${clean}`;
  };

  // --- Construct Detailed Header Block ---
  let header = `/*\n`;
  header += ` * ==========================================================================\n`;
  header += ` * PROJECT:    ${config.controllerName}\n`;
  header += ` * GENERATED:  ${timestamp}\n`;
  header += ` * PLATFORM:   Raspberry Pi Pico (RP2040)\n`;
  header += ` * FRAMEWORK:  Arduino with Control Surface & IRremote\n`;
  header += ` * ==========================================================================\n`;
  header += ` *\n`;
  
  header += ` * REQUIRED LIBRARIES:\n`;
  header += ` * - Control Surface (https://github.com/tttapa/Control-Surface)\n`;
  header += ` * - IRremote (https://github.com/Arduino-IRremote/Arduino-IRremote)\n`;
  if (config.display.enabled) {
    if (config.display.type === 'LCD1602') {
      header += ` * - LiquidCrystal I2C\n`;
    } else {
      header += ` * - U8g2 (OLED Support)\n`;
    }
  }
  header += ` *\n`;

  header += ` * HARDWARE CONFIGURATION:\n`;
  header += ` * --------------------------------------------------------------------------\n`;
  header += ` * [IR Receiver]    Pin: GPIO ${config.irPin}\n`;
  
  if (config.display.enabled) {
    header += ` * [Display 1]      I2C: SDA=${config.display.sdaPin}, SCL=${config.display.sclPin}, Addr=${config.display.i2cAddress}\n`;
    if (config.display.isDual) {
      header += ` * [Display 2]      I2C: SDA=${config.display.sda2Pin}, SCL=${config.display.scl2Pin}, Addr=${config.display.i2cAddress2}\n`;
    }
    header += ` * [Deck Mode]      ${config.display.deckMode ? 'ENABLED (Split-Screen)' : 'DISABLED (Single View)'}\n`;
  }

  if (muxes.length > 0) {
    muxes.forEach(m => {
      header += ` * [Multiplexer]    ID: mux_${safeId(m.id)}, Type: 74HC${m.type === '16' ? '4067' : '4051'}\n`;
      header += ` *                  Control Pins: S0=${m.addressPins[0]}, S1=${m.addressPins[1]}, S2=${m.addressPins[2]}${m.type === '16' ? `, S3=${m.addressPins[3]}` : ''}\n`;
      header += ` *                  Signal Pin: GPIO ${m.signalPin} (Analog/Digital)\n`;
    });
  }

  const allDirectPins: string[] = [];
  buttons.forEach(b => allDirectPins.push(`Button "${b.name}" on GPIO ${b.pin}`));
  faders.forEach(f => allDirectPins.push(`Fader "${f.name}" on GPIO ${f.pin}`));
  encoders.forEach(e => allDirectPins.push(`Encoder "${e.name}" on GPIO ${e.pinA}/${e.pinB}`));
  keypads.forEach(k => allDirectPins.push(`Matrix "${k.name}" Rows:${k.rowPins.join(',')} Cols:${k.colPins.join(',')}`));

  if (allDirectPins.length > 0) {
    header += ` * [Direct GPIOs]   ${allDirectPins.join('\n *                  ')}\n`;
  }

  header += ` * ==========================================================================\n`;
  header += ` */\n\n`;

  // --- Library Includes & Fixes ---
  let code = header;
  code += `#define DECODE_NEC\n#define DECODE_SONY\n#define DECODE_RC5\n#define DECODE_RC6\n`;
  
  if (config.display.enabled && config.display.deckMode) {
    code += `#define USE_SPLIT_DECK_DISPLAY\n`;
  }

  code += `#include <IRremote.hpp>\n`;
  code += `#include <Control_Surface.h>\n`;
  
  if (config.display.enabled) {
    code += `#include <Wire.h>\n`;
    if (config.display.type === 'LCD1602') {
      code += `#include <LiquidCrystal_I2C.h>\n`;
    } else {
      code += `#include <U8g2lib.h>\n`;
    }
  } else {
    code += `#include <Wire.h>\n`;
  }

  code += `\nUSBMIDI_Interface midi;\n\n`;

  // --- Multiplexer Definitions ---
  if (muxes.length > 0) {
    code += `// --- Multiplexers ---\n`;
    muxes.forEach(m => {
      const className = m.type === '16' ? 'CD74HC4067' : 'CD74HC4051';
      const pins = m.addressPins.join(', ');
      code += `${className} mux_${safeId(m.id)} { ${m.signalPin}, {${pins}} };\n`;
    });
    code += `\n`;
  }

  // --- Display Instances ---
  if (config.display.enabled) {
    code += `// --- Displays ---\n`;
    if (config.display.type === 'LCD1602') {
      code += `LiquidCrystal_I2C lcd1(${config.display.i2cAddress}, 16, 2);\n`;
      if (config.display.isDual) code += `LiquidCrystal_I2C lcd2(${config.display.i2cAddress2}, 16, 2);\n`;
    } else {
      const u8g2Type = config.display.type === 'SH1106' ? 'SH1106_128X64_NONAME_F_HW_I2C' : 'SSD1306_128X64_NONAME_F_HW_I2C';
      code += `U8G2_${u8g2Type} u8g2_1(U8G2_R0, U8X8_PIN_NONE, ${config.display.sclPin}, ${config.display.sdaPin});\n`;
      if (config.display.isDual) {
        code += `U8G2_${u8g2Type} u8g2_2(U8G2_R0, U8X8_PIN_NONE, ${config.display.scl2Pin}, ${config.display.sda2Pin});\n`;
      }
    }
    code += `\n`;
  }

  // --- Faders & Pots ---
  code += `// --- Faders & Pots (Direct & MUX) ---\n`;
  faders.forEach(f => {
    code += `CCPotentiometer pot_${safeId(f.id)} { ${f.pin}, {${f.ccNumber}, Channel_${f.channel}} };\n`;
  });
  muxFaders.forEach(mf => {
    const mux = muxes.find(m => m.id === mf.muxId);
    if (mux) {
      const sid = safeId(mf.id);
      if (mf.mode === 'analog') {
        code += `CCPotentiometer mux_pot_${sid} { mux_${safeId(mux.id)}.pin(${mf.channelIndex}), {${mf.ccNumber}, Channel_${mf.midiChannel}} };\n`;
      } else {
        const btnClass = (mf.midiType === MidiType.CC) ? 'CCButton' : 'NoteButton';
        code += `${btnClass} mux_btn_${sid} { mux_${safeId(mux.id)}.pin(${mf.channelIndex}), {${mf.ccNumber}, Channel_${mf.midiChannel}} };\n`;
      }
    }
  });

  // --- Encoders ---
  if (encoders.length > 0) {
    code += `\n// --- Encoders ---\n`;
    encoders.forEach(e => {
      const sid = safeId(e.id);
      const className = e.midiType === MidiType.NOTE_ON ? 'NoteRotaryEncoder' : 'CCRotaryEncoder';
      code += `${className} enc_${sid} { {${e.pinA}, ${e.pinB}}, {${e.ccNumber}, Channel_${e.channel}}, ${Math.round(e.multiplier * 4)} };\n`;
      if (e.pinButton !== undefined) {
        const btnClass = (e.buttonMidiType === MidiType.CC) ? 'CCButton' : 'NoteButton';
        code += `${btnClass} enc_btn_${sid} { ${e.pinButton}, {${e.buttonData1 ?? 60}, Channel_${e.channel}} };\n`;
      }
    });
  }

  // --- Buttons ---
  if (buttons.length > 0) {
    code += `\n// --- Buttons (Direct) ---\n`;
    buttons.forEach(b => {
      const type = b.midiType === MidiType.CC ? 'CCButton' : 'NoteButton';
      code += `${type} btn_${safeId(b.id)} { ${b.pin}, {${b.data1}, Channel_${b.channel}} };\n`;
    });
  }

  // --- Keypads ---
  if (keypads.length > 0) {
    code += `\n// --- Keypads ---\n`;
    keypads.forEach(k => {
      const sid = safeId(k.id);
      const className = k.mode === MidiType.CC ? 'CCButtonMatrix' : 'NoteButtonMatrix';
      code += `const PinList<4> rowPins_${sid} = {${k.rowPins.join(', ')}};\n`;
      code += `const PinList<4> colPins_${sid} = {${k.colPins.join(', ')}};\n`;
      code += `const AddressMatrix<4, 4> addresses_${sid} = {{\n`;
      k.values.forEach(row => code += `  {${row.join(', ')}},\n`);
      code += `}};\n`;
      code += `${className}<4, 4> keypad_${sid} { rowPins_${sid}, colPins_${sid}, addresses_${sid}, Channel_${k.channel} };\n`;
    });
  }

  // --- IR Logic Helper ---
  const irLogic = irMappings
    .filter(m => formatHex(m.irCode) !== null)
    .map(m => {
      const hexCode = formatHex(m.irCode);
      let action = '';
      if (m.midiType === MidiType.NOTE_ON) action = `midi.sendNoteOn({${m.data1}, Channel_${m.channel}}, ${m.data2});`;
      else if (m.midiType === MidiType.CC) action = `midi.sendControlChange({${m.data1}, Channel_${m.channel}}, ${m.data2});`;
      else action = `midi.sendProgramChange({Channel_${m.channel}}, ${m.data1});`;
      
      return `    if (IrReceiver.decodedIRData.protocol == decode_type_t::${m.irProtocol} && IrReceiver.decodedIRData.command == ${hexCode}) {\n      ${action}\n      return;\n    }`;
    }).join('\n');

  // --- Setup & Loop ---
  code += `\nvoid setup() {\n`;
  code += `  Serial.begin(115200);\n\n`;
  
  code += `  Wire.setSDA(${config.display.sdaPin});\n`;
  code += `  Wire.setSCL(${config.display.sclPin});\n`;
  code += `  Wire.begin();\n\n`;

  if (config.display.enabled) {
    if (config.display.type === 'LCD1602') {
      code += `  lcd1.init(); lcd1.backlight();\n`;
      if (config.display.isDual) code += `  lcd2.init(); lcd2.backlight();\n`;
    } else {
      code += `  u8g2_1.begin();\n`;
      if (config.display.isDual) code += `  u8g2_2.begin();\n`;
      
      if (config.display.deckMode) {
        code += `  u8g2_1.clearBuffer();\n`;
        code += `  u8g2_1.setFont(u8g2_font_6x10_tf);\n`;
        code += `  u8g2_1.drawStr(0, 10, "Deck 1");\n`;
        code += `  u8g2_1.drawStr(64, 10, "| Deck 2");\n`;
        code += `  u8g2_1.drawHLine(0, 12, 128);\n`;
        code += `  u8g2_1.sendBuffer();\n`;
      }
    }
  }

  code += `\n  Control_Surface.begin();\n`;
  code += `  IrReceiver.begin(${config.irPin}, ${config.useLedFeedback ? 'ENABLE_LED_FEEDBACK' : 'DISABLE_LED_FEEDBACK'});\n`;
  code += `}\n\nvoid loop() {\n`;
  code += `  Control_Surface.loop();\n\n`;
  code += `  if (IrReceiver.decode()) {\n`;
  code += `    if (!(IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT)) {\n`;
  code += irLogic ? irLogic : `      // No IR Mappings defined`;
  code += `\n    }\n`;
  code += `    IrReceiver.resume();\n`;
  code += `  }\n}\n`;

  return code;
};