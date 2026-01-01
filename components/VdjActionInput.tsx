import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const VDJ_COMMANDS = [
  // --- Transport & Deck Controls ---
  'play_pause', 'stop', 'cue_stop', 'sync', 'loop', 'reloop', 'loop_halve', 'loop_double',
  'pitch_reset', 'pitch_bend +1%', 'pitch_bend -1%', 'vinyl_mode', 'slip_mode', 'quantize',
  'master_tempo', 'key_lock',
  
  // --- Mixer & EQ (Analog/Faders) ---
  'volume', 'volume_deck 1', 'volume_deck 2', 'crossfader', 
  'eq_low', 'eq_mid', 'eq_high', 'filter', 'gain', 'pitch',
  'eq_low_deck 1', 'eq_mid_deck 1', 'eq_high_deck 1',
  'eq_low_deck 2', 'eq_mid_deck 2', 'eq_high_deck 2',
  'master_volume', 'headphones_volume', 'headphones_mix',
  'cue_monitor_deck 1', 'cue_monitor_deck 2',
  
  // --- Jog Wheel & Scratching ---
  'jog_wheel', 'scratch', 'touch_wheel', 'search', 'jog_wheel_touch',
  
  // --- Navigation & Browser ---
  'browser_scroll', 'browser_enter', 'browser_back', 'load',
  'sideview_scroll', 'sideview_enter', 'playlist_add', 'browser_folder',
  
  // --- Performance & Hotcues ---
  'hotcue 1', 'hotcue 2', 'hotcue 3', 'hotcue 4', 'hotcue 5', 'hotcue 6', 'hotcue 7', 'hotcue 8',
  'delete_hotcue 1', 'goto_hotcue 1', 'hotcue_mode',
  
  // --- Sampler Controls ---
  'sampler_play 1', 'sampler_play 2', 'sampler_play 3', 'sampler_play 4', 
  'sampler_play 5', 'sampler_play 6', 'sampler_play 7', 'sampler_play 8',
  'sampler_stop 1', 'sampler_stop 2', 'sampler_stop 3', 'sampler_stop 4', 
  'sampler_stop 5', 'sampler_stop 6', 'sampler_stop 7', 'sampler_stop 8',
  'sampler_play_stop 1', 'sampler_play_stop 2', 'sampler_play_stop 3', 'sampler_play_stop 4',
  'sampler_play_hold 1', 'sampler_play_hold 2', 'sampler_play_hold 3', 'sampler_play_hold 4',
  'sampler_play_stutter 1', 'sampler_play_stutter 2', 'sampler_play_stutter 3', 'sampler_play_stutter 4',
  'sampler_stop_all',
  'sampler_volume', 'sampler_volume 1', 'sampler_volume 2', 'sampler_volume 3', 'sampler_volume 4',
  'sampler_bank next', 'sampler_bank prev', 'sampler_bank +1', 'sampler_bank -1', 
  'sampler_bank "Main"', 'sampler_bank "Drums"', 'sampler_bank "FX"', 'sampler_bank "Drops"', 'sampler_bank "Loop"',
  'sampler_pad 1', 'sampler_pad 2', 'sampler_pad 3', 'sampler_pad 4',
  'sampler_pad 5', 'sampler_pad 6', 'sampler_pad 7', 'sampler_pad 8',
  'sampler_pad_stop 1', 'sampler_pad_stop 2', 'sampler_pad_stop 3', 'sampler_pad_stop 4',
  'sampler_select 1', 'sampler_select 2', 'sampler_select 3', 'sampler_select 4',
  'sampler_rec 1', 'sampler_rec 2',
  
  // --- Effects ---
  'effect active', 'effect select +1', 'effect select -1',
  'effect slider 1', 'effect slider 2', 'effect slider 3',
  'effect_button 1', 'effect_button 2', 'effect_knob 1', 'effect_knob 2',
  'filter_active', 'filter_knob',
  
  // --- Miscellaneous ---
  'mic_active', 'talkover', 'record', 'automix', 'video_transition'
];

const VdjActionInput: React.FC<Props> = ({ value, onChange, placeholder, className }) => {
  const listId = `vdj-commands-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative w-full">
      <input
        list={listId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <datalist id={listId}>
        {VDJ_COMMANDS.map((cmd) => (
          <option key={cmd} value={cmd} />
        ))}
      </datalist>
    </div>
  );
};

export default VdjActionInput;