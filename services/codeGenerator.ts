import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, EncoderMapping, MidiType, IrProtocol, GeneratorConfig } from '../types';

export const generateArduinoCode = (
  irMappings: Mapping[], 
  buttons: ButtonMapping[], 
  faders: FaderMapping[], 
  keypads: KeypadMapping[],
  config: GeneratorConfig,
  encoders: EncoderMapping[] = []
): string => {
  const timestamp = new Date().toLocaleString('de-DE');

  const formatHex = (hex: string) => {
    const clean = hex.trim();
    if (!clean) return null;
    return clean.startsWith('0x') || clean.startsWith('0X') ? clean : `0x${clean}`;
  };

  // --- Header Documentation ---
  let headerDoc = `/*\n * ==========================================================================\n`;
  headerDoc += ` * PROJECT: ${config.controllerName}\n`;
  headerDoc += ` * GENERATED: ${timestamp}\n`;
  headerDoc += ` * PLATFORM: Raspberry Pi Pico (RP2040)\n`;
  headerDoc += ` * ==========================================================================\n *\n`;
  
  headerDoc += ` * REQUIRED LIBRARIES:\n`;
  headerDoc += ` * - Control Surface (https://github.com/tttapa/Control-Surface)\n`;
  headerDoc += ` * - IRremote (https://github.com/Arduino-IRremote/Arduino-IRremote)\n`;
  if (config.display.enabled) {
    if (config.display.type === 'SH1106') {
      headerDoc += ` * - U8g2 (https://github.com/olikraus/u8g2)\n`;
    } else {
      headerDoc += ` * - LiquidCrystal I2C (https://github.com/johnrickman/LiquidCrystal_I2C)\n`;
    }
  }
  headerDoc += ` *\n * HINWEIS: Architektur-Warnungen in der IDE können beim RP2040 ignoriert werden.\n`;
  headerDoc += ` * --------------------------------------------------------------------------\n`;
  headerDoc += ` * HARDWARE SETUP:\n`;
  headerDoc += ` * - IR RECEIVER PIN: GPIO ${config.irPin}\n`;
  if (config.display.enabled) {
    headerDoc += ` * - DISPLAY (${config.display.type}): I2C SDA=${config.display.sdaPin}, SCL=${config.display.sclPin}, ADDR=${config.display.i2cAddress}\n`;
  }
  headerDoc += ` * ==========================================================================\n */`;

  // --- Definitions Helpers ---
  const encoderDefs = encoders.map(e => {
    const safeName = e.name.replace(/\s+/g, '_') || `encoder_${e.id}`;
    let def = `CCRotaryEncoder ${safeName} { {${e.pinA}, ${e.pinB}}, {${e.ccNumber}, Channel_${e.channel}}, ${Math.round(e.multiplier * 4)} };`;
    if (e.pinButton !== undefined && e.pinButton !== null) {
      const btnName = `${safeName}_btn`;
      const type = e.buttonMidiType === MidiType.CC ? 'CCButton' : 'NoteButton';
      def += `\n${type} ${btnName} {${e.pinButton}, {${e.buttonData1 ?? 60}, Channel_${e.channel}}};`;
    }
    return def;
  }).join('\n');

  const buttonDefs = buttons.map(b => {
    const safeName = b.name.replace(/\s+/g, '_') || `btn_${b.id}`;
    const type = b.midiType === MidiType.CC ? 'CCButton' : 'NoteButton';
    return `${type} ${safeName} {${b.pin}, {${b.data1}, Channel_${b.channel}}};`;
  }).join('\n');

  const faderDefs = faders.map(f => {
    const safeName = f.name.replace(/\s+/g, '_') || `pot_${f.id}`;
    return `CCPotentiometer ${safeName} {${f.pin}, {${f.ccNumber}, Channel_${f.channel}}};`;
  }).join('\n');

  const keypadDefs = keypads.map(k => {
    const safeName = k.name.replace(/\s+/g, '_') || `keypad_${k.id}`;
    const className = k.mode === MidiType.CC ? 'CCButtonMatrix' : 'NoteButtonMatrix';
    return `const PinList<4> ${safeName}_rowPins = { ${k.rowPins.join(', ')} };\nconst PinList<4> ${safeName}_colPins = { ${k.colPins.join(', ')} };\nconst AddressMatrix<4, 4> ${safeName}_addresses = {{\n${k.values.map(row => `    { ${row.join(', ')} }`).join(',\n')}\n}};\n${className}<4, 4> ${safeName} = { ${safeName}_rowPins, ${safeName}_colPins, ${safeName}_addresses, Channel_${k.channel} };`;
  }).join('\n');

  // --- IR Logic ---
  const irLogic = irMappings
    .filter(m => formatHex(m.irCode) !== null)
    .map(m => {
      const hexCode = formatHex(m.irCode);
      const vdjDesc = m.vdjAction || (m.midiType === MidiType.CC ? `CC ${m.data1}` : `Note ${m.data1}`);
      let action = '';
      if (m.midiType === MidiType.NOTE_ON) action = `midi.sendNoteOn({${m.data1}, Channel_${m.channel}}, ${m.data2});`;
      else if (m.midiType === MidiType.CC) action = `midi.sendControlChange({${m.data1}, Channel_${m.channel}}, ${m.data2});`;
      else action = `midi.sendProgramChange({Channel_${m.channel}}, ${m.data1});`;
      
      return `    if (IrReceiver.decodedIRData.protocol == decode_type_t::${m.irProtocol} && IrReceiver.decodedIRData.command == ${hexCode}) {
        ${action}
        updateDisplay(${m.channel}, "${vdjDesc}");
        return;
    }`;
    }).join('\n');

  // --- Display Specific Logic ---
  let displayGlobals = '';
  let displaySetupCode = '';
  let updateDisplayFunc = 'void updateDisplay(int ch, const char* m) {}';

  if (config.display.enabled) {
    if (config.display.type === 'SH1106') {
      displayGlobals = `#include <U8g2lib.h>\nU8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE, /* clock=*/ ${config.display.sclPin}, /* data=*/ ${config.display.sdaPin});\nchar deck1Msg[20] = "Ready";\nchar deck2Msg[20] = "Ready";`;
      displaySetupCode = `    u8g2.begin();\n    if (${config.display.inverted}) u8g2.setContrast(0);`;
      updateDisplayFunc = `void updateDisplay(int channel, const char* msg) {
  ${config.display.deckMode ? `
    if (channel == 1) strncpy(deck1Msg, msg, 19);
    else if (channel == 2) strncpy(deck2Msg, msg, 19);
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_ncenB08_tr);
    u8g2.drawStr(0, 10, "DECK 1");
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 24, deck1Msg);
    u8g2.drawHLine(0, 31, 128);
    u8g2.setFont(u8g2_font_ncenB08_tr);
    u8g2.drawStr(0, 45, "DECK 2");
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 59, deck2Msg);
    u8g2.sendBuffer();` : `
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_ncenB08_tr);
    u8g2.drawStr(0, 10, "MIDI STATUS");
    u8g2.drawHLine(0, 12, 128);
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 30, msg);
    u8g2.sendBuffer();`}
}`;
    } else {
      displayGlobals = `#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(${config.display.i2cAddress}, 16, 2);`;
      displaySetupCode = `    lcd.init();\n    lcd.backlight();\n    if (${config.display.inverted}) lcd.noBacklight();`;
      updateDisplayFunc = `void updateDisplay(int channel, const char* msg) {
  ${config.display.deckMode ? `
    lcd.setCursor(0, channel == 1 ? 0 : 1);
    char buf[17];
    snprintf(buf, 17, "D%d: %-12s", channel, msg);
    lcd.print(buf);` : `
    lcd.setCursor(0, 0);
    lcd.print("MIDI STATUS     ");
    lcd.setCursor(0, 1);
    char buf[17];
    snprintf(buf, 17, "%-16s", msg);
    lcd.print(buf);`}
}`;
    }
  }

  return `${headerDoc}

#include <Arduino.h>
#include <Wire.h>

// 1. IR Protocols
#define DECODE_NEC
#define DECODE_SONY
#define DECODE_RC5
#define DECODE_RC6
#define DECODE_SAMSUNG
#include <IRremote.hpp>

// 2. Control Surface Setup
#include <Control_Surface.h>

USBMIDI_Interface midi;

// --- Display Section ---
${displayGlobals}

${updateDisplayFunc}

// --- Encoders ---
${encoderDefs}

// --- Buttons ---
${buttonDefs}

// --- Faders ---
${faderDefs}

// --- Keypads ---
${keypadDefs}

void setup() {
  Serial.begin(115200);
  
  // I2C Setup
  Wire.setSDA(${config.display.sdaPin});
  Wire.setSCL(${config.display.sclPin});
  Wire.begin();
  
${config.display.enabled ? displaySetupCode : ''}

  Control_Surface.begin();
  IrReceiver.begin(${config.irPin}, ${config.useLedFeedback ? 'ENABLE_LED_FEEDBACK' : 'DISABLE_LED_FEEDBACK'});
  
  Serial.println(F("MIDI Controller Ready"));
  updateDisplay(1, "Ready");
}

void loop() {
  Control_Surface.loop();

  if (IrReceiver.decode()) {
    if (!(IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT)) {
      // Serial Log for Web-Assistant
      Serial.print(F("Protocol: "));
      Serial.print(IrReceiver.decodedIRData.protocol); 
      Serial.print(F(" Code: 0x"));
      Serial.println(IrReceiver.decodedIRData.command, HEX);
      
      ${irLogic}
    }
    IrReceiver.resume();
  }
}
`;
};