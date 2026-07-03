use std::collections::VecDeque;
use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::audio::decoder::DecodedClip;

const MAX_MIC_FRAMES: usize = 48_000;
const MAX_MONITOR_FRAMES: usize = 48_000;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum MonitorMode {
    ClipsOnly,
    FullMix,
    Off,
}

impl Default for MonitorMode {
    fn default() -> Self {
        Self::ClipsOnly
    }
}

#[derive(Debug, Clone)]
pub struct MixerSettings {
    pub master_volume: u8,
    pub mic_volume: u8,
    pub mic_muted: bool,
    pub monitor_mode: MonitorMode,
}

impl Default for MixerSettings {
    fn default() -> Self {
        Self {
            master_volume: 100,
            mic_volume: 100,
            mic_muted: false,
            monitor_mode: MonitorMode::ClipsOnly,
        }
    }
}

pub struct Mixer {
    sample_rate: u32,
    voices: Vec<Voice>,
    mic_frames: VecDeque<f32>,
    monitor_frames: VecDeque<f32>,
    settings: MixerSettings,
}

impl Mixer {
    pub fn new(sample_rate: u32, settings: MixerSettings) -> Self {
        Self {
            sample_rate,
            voices: Vec::new(),
            mic_frames: VecDeque::with_capacity(MAX_MIC_FRAMES),
            monitor_frames: VecDeque::with_capacity(MAX_MONITOR_FRAMES),
            settings,
        }
    }

    pub fn play_clip(&mut self, clip_id: String, clip: DecodedClip, clip_volume: u8) {
        self.voices.retain(|voice| voice.clip_id != clip_id);
        self.voices.push(Voice::new(clip_id, clip, clip_volume));
    }

    pub fn stop_all(&mut self) {
        self.voices.clear();
        self.monitor_frames.clear();
    }

    pub fn set_volumes(&mut self, master_volume: u8, mic_volume: u8, mic_muted: bool) {
        self.settings.master_volume = master_volume.min(100);
        self.settings.mic_volume = mic_volume.min(100);
        self.settings.mic_muted = mic_muted;
    }

    pub fn set_monitor_mode(&mut self, monitor_mode: MonitorMode) {
        self.settings.monitor_mode = monitor_mode;
    }

    pub fn push_input_samples(&mut self, input: &[f32], channels: usize, input_sample_rate: u32) {
        if input.is_empty() || channels == 0 {
            return;
        }

        let mono = downmix_to_mono(input, channels);
        let frames = resample_mono(&mono, input_sample_rate.max(1), self.sample_rate.max(1));

        for sample in frames {
            if self.mic_frames.len() >= MAX_MIC_FRAMES {
                self.mic_frames.pop_front();
            }
            self.mic_frames.push_back(sample);
        }
    }

    pub fn write_virtual_output(&mut self, output: &mut [f32], channels: usize) {
        if channels == 0 {
            return;
        }

        for frame in output.chunks_mut(channels) {
            let mic = self.next_mic_sample();
            let clip = self.next_clip_frame();
            let mixed = (mic + clip).clamp(-1.0, 1.0);

            self.push_monitor_sample(match self.settings.monitor_mode {
                MonitorMode::ClipsOnly => clip,
                MonitorMode::FullMix => mixed,
                MonitorMode::Off => 0.0,
            });

            for sample in frame {
                *sample = mixed;
            }
        }
    }

    pub fn write_monitor_output(&mut self, output: &mut [f32], channels: usize) {
        if channels == 0 {
            return;
        }

        for frame in output.chunks_mut(channels) {
            let sample = self.monitor_frames.pop_front().unwrap_or(0.0);
            for output_sample in frame {
                *output_sample = sample;
            }
        }
    }

    #[cfg(test)]
    pub fn active_voice_count(&self) -> usize {
        self.voices.len()
    }

    fn next_mic_sample(&mut self) -> f32 {
        if self.settings.mic_muted {
            return 0.0;
        }

        let gain = percent_to_gain(self.settings.mic_volume);
        self.mic_frames.pop_front().unwrap_or(0.0) * gain
    }

    fn next_clip_frame(&mut self) -> f32 {
        let master_gain = percent_to_gain(self.settings.master_volume);
        let mut sample = 0.0;

        for voice in &mut self.voices {
            sample += voice.next_sample(self.sample_rate) * master_gain;
        }

        self.voices.retain(|voice| !voice.finished());
        sample.clamp(-1.0, 1.0)
    }

    fn push_monitor_sample(&mut self, sample: f32) {
        if self.settings.monitor_mode == MonitorMode::Off {
            return;
        }

        if self.monitor_frames.len() >= MAX_MONITOR_FRAMES {
            self.monitor_frames.pop_front();
        }
        self.monitor_frames.push_back(sample);
    }
}

struct Voice {
    clip_id: String,
    samples: Arc<[f32]>,
    channels: usize,
    sample_rate: u32,
    position: f64,
    gain: f32,
}

impl Voice {
    fn new(clip_id: String, clip: DecodedClip, clip_volume: u8) -> Self {
        Self {
            clip_id,
            samples: Arc::from(clip.samples.into_boxed_slice()),
            channels: clip.channels.max(1),
            sample_rate: clip.sample_rate.max(1),
            position: 0.0,
            gain: percent_to_gain(clip_volume),
        }
    }

    fn next_sample(&mut self, output_sample_rate: u32) -> f32 {
        if self.finished() {
            return 0.0;
        }

        let frame_index = self.position.floor() as usize;
        let sample = self.frame_mono_sample(frame_index) * self.gain;
        self.position += self.sample_rate as f64 / output_sample_rate.max(1) as f64;
        sample
    }

    fn finished(&self) -> bool {
        self.position.floor() as usize >= self.samples.len() / self.channels
    }

    fn frame_mono_sample(&self, frame_index: usize) -> f32 {
        let start = frame_index * self.channels;
        if start >= self.samples.len() {
            return 0.0;
        }

        let end = (start + self.channels).min(self.samples.len());
        let sum: f32 = self.samples[start..end].iter().sum();
        sum / (end - start) as f32
    }
}

fn percent_to_gain(value: u8) -> f32 {
    (value.min(100) as f32) / 100.0
}

fn downmix_to_mono(input: &[f32], channels: usize) -> Vec<f32> {
    input
        .chunks(channels)
        .map(|frame| frame.iter().sum::<f32>() / frame.len() as f32)
        .collect()
}

fn resample_mono(input: &[f32], source_rate: u32, target_rate: u32) -> Vec<f32> {
    if source_rate == target_rate || input.len() < 2 {
        return input.to_vec();
    }

    let ratio = source_rate as f64 / target_rate as f64;
    let output_len = ((input.len() as f64) / ratio).ceil() as usize;
    let mut output = Vec::with_capacity(output_len);

    for index in 0..output_len {
        let source_position = index as f64 * ratio;
        let left = source_position.floor() as usize;
        let right = (left + 1).min(input.len() - 1);
        let fraction = (source_position - left as f64) as f32;
        output.push(input[left] * (1.0 - fraction) + input[right] * fraction);
    }

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mixes_mic_and_clip_with_gains() {
        let mut mixer = Mixer::new(
            48_000,
            MixerSettings {
                master_volume: 50,
                mic_volume: 25,
                mic_muted: false,
                monitor_mode: MonitorMode::ClipsOnly,
            },
        );
        mixer.push_input_samples(&[0.8, 0.8], 1, 48_000);
        mixer.play_clip(
            "clip".to_string(),
            DecodedClip {
                samples: vec![0.4, 0.4],
                channels: 1,
                sample_rate: 48_000,
            },
            100,
        );

        let mut output = [0.0; 2];
        mixer.write_virtual_output(&mut output, 1);

        assert_eq!(output, [0.4, 0.4]);
    }

    #[test]
    fn retriggering_clip_replaces_existing_voice() {
        let mut mixer = Mixer::new(48_000, MixerSettings::default());
        let clip = DecodedClip {
            samples: vec![0.5, 0.5],
            channels: 1,
            sample_rate: 48_000,
        };

        mixer.play_clip("clip".to_string(), clip.clone(), 100);
        mixer.play_clip("clip".to_string(), clip, 100);

        assert_eq!(mixer.active_voice_count(), 1);
    }

    #[test]
    fn monitor_clips_only_omits_mic() {
        let mut mixer = Mixer::new(48_000, MixerSettings::default());
        mixer.push_input_samples(&[1.0], 1, 48_000);
        mixer.play_clip(
            "clip".to_string(),
            DecodedClip {
                samples: vec![0.25],
                channels: 1,
                sample_rate: 48_000,
            },
            100,
        );

        let mut virtual_output = [0.0; 1];
        let mut monitor_output = [0.0; 1];
        mixer.write_virtual_output(&mut virtual_output, 1);
        mixer.write_monitor_output(&mut monitor_output, 1);

        assert_eq!(virtual_output, [1.0]);
        assert_eq!(monitor_output, [0.25]);
    }
}
