export enum MidiType {
  NOTE_ON = 'Note On',
  NOTE_OFF = 'Note Off',
  CC = 'Control Change',
  PROGRAM_CHANGE = 'Program Change'
}

export enum IrProtocol {
  NEC = 'NEC',
  SONY = 'SONY',
  RC5 = 'RC5',
  RC6 = 'RC6',
  SAMSUNG = 'SAMSUNG'
}

export interface Mapping {
  id: string;
  irCode: string;
  irProtocol: IrProtocol;
  midiType: MidiType;
  channel: number;
  data1: number;
  data2: number;
  description?: string;
  vdjAction?: string;
}

export interface ButtonMapping {
  id: string;
  name: string;
  pin: number;
  midiType: MidiType.NOTE_ON | MidiType.CC;
  channel: number;
  data1: number;
  vdjAction?: string;
}

export interface FaderMapping {
  id: string;
  name: string;
  pin: number;
  channel: number;
  ccNumber: number;
  vdjAction?: string;
}

export interface MuxFaderMapping {
  id: string;
  muxId: string;
  channelIndex: number; // 0-15
  mode: 'analog' | 'digital';
  midiType: MidiType.NOTE_ON | MidiType.CC;
  midiChannel: number;
  ccNumber: number; // Also used for Note number
  vdjAction?: string;
}

export interface MultiplexerConfig {
  id: string;
  name: string;
  type: '8' | '16';
  addressPins: number[]; // [S0, S1, S2, S3]
  signalPin: number; // Analog/Digital Input Pin (Z)
}

export interface EncoderMapping {
  id: string;
  name: string;
  pinA: number;
  pinB: number;
  pinButton?: number;
  midiType: MidiType.NOTE_ON | MidiType.CC;
  buttonMidiType?: MidiType.NOTE_ON | MidiType.CC;
  buttonData1?: number;
  channel: number;
  ccNumber: number; // Represents Note number if midiType is Note
  multiplier: number;
  vdjActionRotate?: string;
  vdjActionClick?: string;
}

export interface KeypadMapping {
  id: string;
  name: string;
  mode: MidiType.NOTE_ON | MidiType.CC;
  channel: number;
  rowPins: [number, number, number, number];
  colPins: [number, number, number, number];
  values: number[][];
  vdjActions?: string[][];
}

export type DisplayType = 'SH1106' | 'SSD1306' | 'LCD1602';

export interface DisplaySettings {
  enabled: boolean;
  type: DisplayType;
  isDual: boolean;
  sdaPin: number;
  sclPin: number;
  i2cAddress: string;
  sda2Pin: number;
  scl2Pin: number;
  i2cAddress2: string;
  showIrLog: boolean;
  showMidiLog: boolean;
  inverted: boolean;
  deckMode: boolean;
}

export interface GeneratorConfig {
  irPin: number;
  useLedFeedback: boolean;
  controllerName: string;
  display: DisplaySettings;
}