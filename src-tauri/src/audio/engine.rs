use std::sync::Arc;

use cpal::traits::{DeviceTrait, StreamTrait};
use cpal::{FromSample, Sample, SampleFormat, SizedSample, Stream, StreamConfig};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Runtime};

use crate::audio::decoder::{decode_clip, DecodedClip};
use crate::audio::devices::{input_device_by_id, output_device_by_id};
use crate::audio::mixer::{Mixer, MixerSettings};

pub use crate::audio::mixer::MonitorMode;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioRoutingConfig {
    pub enabled: bool,
    pub input_device_id: Option<String>,
    pub virtual_output_device_id: Option<String>,
    pub monitor_output_device_id: Option<String>,
    pub monitor_mode: MonitorMode,
    pub mic_volume: u8,
    pub mic_muted: bool,
}

impl Default for AudioRoutingConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            input_device_id: None,
            virtual_output_device_id: None,
            monitor_output_device_id: None,
            monitor_mode: MonitorMode::ClipsOnly,
            mic_volume: 100,
            mic_muted: false,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioEngineEvent {
    pub message: String,
}

pub struct AudioEngineState {
    engine: Mutex<Option<RunningAudioEngine>>,
}

impl AudioEngineState {
    pub fn new() -> Self {
        Self {
            engine: Mutex::new(None),
        }
    }

    pub fn start<R: Runtime>(
        &self,
        app: AppHandle<R>,
        config: AudioRoutingConfig,
        master_volume: u8,
    ) -> Result<(), String> {
        self.stop();
        let engine = RunningAudioEngine::start(app, config, master_volume)?;
        *self.engine.lock() = Some(engine);
        Ok(())
    }

    pub fn stop(&self) {
        *self.engine.lock() = None;
    }

    pub fn play_clip(
        &self,
        clip_id: String,
        clip: DecodedClip,
        clip_volume: u8,
    ) -> Result<(), String> {
        let engine_guard = self.engine.lock();
        let Some(engine) = engine_guard.as_ref() else {
            return Err("Audio routing is not running".to_string());
        };

        engine.mixer.lock().play_clip(clip_id, clip, clip_volume);
        Ok(())
    }

    pub fn stop_all(&self) {
        if let Some(engine) = self.engine.lock().as_ref() {
            engine.mixer.lock().stop_all();
        }
    }

    pub fn set_volumes(&self, master_volume: u8, mic_volume: u8, mic_muted: bool) {
        if let Some(engine) = self.engine.lock().as_ref() {
            engine
                .mixer
                .lock()
                .set_volumes(master_volume, mic_volume, mic_muted);
        }
    }

    pub fn set_monitor_mode(&self, monitor_mode: MonitorMode) {
        if let Some(engine) = self.engine.lock().as_ref() {
            engine.mixer.lock().set_monitor_mode(monitor_mode);
        }
    }
}

struct RunningAudioEngine {
    #[allow(dead_code)]
    input_stream: Option<Stream>,
    #[allow(dead_code)]
    virtual_output_stream: Stream,
    #[allow(dead_code)]
    monitor_output_stream: Option<Stream>,
    mixer: Arc<Mutex<Mixer>>,
}

impl RunningAudioEngine {
    fn start<R: Runtime>(
        app: AppHandle<R>,
        config: AudioRoutingConfig,
        master_volume: u8,
    ) -> Result<Self, String> {
        let output_device = output_device_by_id(config.virtual_output_device_id.as_deref())?;
        let output_config = output_device
            .default_output_config()
            .map_err(|e| e.to_string())?;
        let output_sample_rate = output_config.sample_rate();
        let mixer = Arc::new(Mutex::new(Mixer::new(
            output_sample_rate,
            MixerSettings {
                master_volume: master_volume.min(100),
                mic_volume: config.mic_volume.min(100),
                mic_muted: config.mic_muted,
                monitor_mode: config.monitor_mode,
            },
        )));

        let virtual_output_stream = build_virtual_output_stream(
            app.clone(),
            &output_device,
            output_config.clone(),
            Arc::clone(&mixer),
        )?;

        let input_stream = match input_device_by_id(config.input_device_id.as_deref())? {
            Some(input_device) => {
                let input_config = input_device
                    .default_input_config()
                    .map_err(|e| e.to_string())?;
                Some(build_input_stream(
                    app.clone(),
                    &input_device,
                    input_config,
                    Arc::clone(&mixer),
                )?)
            }
            None => None,
        };

        let monitor_output_stream = if config.monitor_mode == MonitorMode::Off {
            None
        } else if let Some(device_id) = config.monitor_output_device_id.as_deref() {
            let monitor_device = output_device_by_id(Some(device_id))?;
            let monitor_config = monitor_device
                .default_output_config()
                .map_err(|e| e.to_string())?;
            Some(build_monitor_output_stream(
                app.clone(),
                &monitor_device,
                monitor_config,
                Arc::clone(&mixer),
            )?)
        } else {
            None
        };

        virtual_output_stream.play().map_err(|e| e.to_string())?;
        if let Some(stream) = &input_stream {
            stream.play().map_err(|e| e.to_string())?;
        }
        if let Some(stream) = &monitor_output_stream {
            stream.play().map_err(|e| e.to_string())?;
        }

        Ok(Self {
            input_stream,
            virtual_output_stream,
            monitor_output_stream,
            mixer,
        })
    }
}

pub async fn decode_clip_for_engine(path: String) -> Result<DecodedClip, String> {
    tauri::async_runtime::spawn_blocking(move || decode_clip(&path))
        .await
        .map_err(|e| e.to_string())?
}

fn build_virtual_output_stream<R: Runtime>(
    app: AppHandle<R>,
    device: &cpal::Device,
    supported_config: cpal::SupportedStreamConfig,
    mixer: Arc<Mutex<Mixer>>,
) -> Result<Stream, String> {
    let sample_format = supported_config.sample_format();
    let config: StreamConfig = supported_config.into();
    let channels = config.channels as usize;

    match sample_format {
        SampleFormat::I8 => {
            build_output_stream::<i8, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::I16 => {
            build_output_stream::<i16, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::I32 => {
            build_output_stream::<i32, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::I64 => {
            build_output_stream::<i64, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::U8 => {
            build_output_stream::<u8, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::U16 => {
            build_output_stream::<u16, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::U32 => {
            build_output_stream::<u32, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::U64 => {
            build_output_stream::<u64, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::F32 => {
            build_output_stream::<f32, R>(app, device, config, channels, mixer, false)
        }
        SampleFormat::F64 => {
            build_output_stream::<f64, R>(app, device, config, channels, mixer, false)
        }
        format => Err(format!("Unsupported output sample format: {format}")),
    }
}

fn build_monitor_output_stream<R: Runtime>(
    app: AppHandle<R>,
    device: &cpal::Device,
    supported_config: cpal::SupportedStreamConfig,
    mixer: Arc<Mutex<Mixer>>,
) -> Result<Stream, String> {
    let sample_format = supported_config.sample_format();
    let config: StreamConfig = supported_config.into();
    let channels = config.channels as usize;

    match sample_format {
        SampleFormat::I8 => {
            build_output_stream::<i8, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::I16 => {
            build_output_stream::<i16, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::I32 => {
            build_output_stream::<i32, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::I64 => {
            build_output_stream::<i64, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::U8 => {
            build_output_stream::<u8, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::U16 => {
            build_output_stream::<u16, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::U32 => {
            build_output_stream::<u32, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::U64 => {
            build_output_stream::<u64, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::F32 => {
            build_output_stream::<f32, R>(app, device, config, channels, mixer, true)
        }
        SampleFormat::F64 => {
            build_output_stream::<f64, R>(app, device, config, channels, mixer, true)
        }
        format => Err(format!("Unsupported monitor sample format: {format}")),
    }
}

fn build_output_stream<T, R: Runtime>(
    app: AppHandle<R>,
    device: &cpal::Device,
    config: StreamConfig,
    channels: usize,
    mixer: Arc<Mutex<Mixer>>,
    monitor: bool,
) -> Result<Stream, String>
where
    T: SizedSample + Sample + FromSample<f32>,
{
    let err_app = app.clone();
    device
        .build_output_stream(
            config,
            move |data: &mut [T], _| {
                let mut f32_output = vec![0.0; data.len()];
                {
                    let mut mixer = mixer.lock();
                    if monitor {
                        mixer.write_monitor_output(&mut f32_output, channels);
                    } else {
                        mixer.write_virtual_output(&mut f32_output, channels);
                    }
                }
                for (output, sample) in data.iter_mut().zip(f32_output.into_iter()) {
                    *output = T::from_sample(sample);
                }
            },
            move |err| emit_engine_error(&err_app, format!("Audio output stream error: {err}")),
            None,
        )
        .map_err(|e| e.to_string())
}

fn build_input_stream<R: Runtime>(
    app: AppHandle<R>,
    device: &cpal::Device,
    supported_config: cpal::SupportedStreamConfig,
    mixer: Arc<Mutex<Mixer>>,
) -> Result<Stream, String> {
    let sample_format = supported_config.sample_format();
    let input_sample_rate = supported_config.sample_rate();
    let config: StreamConfig = supported_config.into();
    let channels = config.channels as usize;

    match sample_format {
        SampleFormat::I8 => {
            build_input_stream_for::<i8, R>(app, device, config, channels, input_sample_rate, mixer)
        }
        SampleFormat::I16 => build_input_stream_for::<i16, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        SampleFormat::I32 => build_input_stream_for::<i32, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        SampleFormat::I64 => build_input_stream_for::<i64, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        SampleFormat::U8 => {
            build_input_stream_for::<u8, R>(app, device, config, channels, input_sample_rate, mixer)
        }
        SampleFormat::U16 => build_input_stream_for::<u16, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        SampleFormat::U32 => build_input_stream_for::<u32, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        SampleFormat::U64 => build_input_stream_for::<u64, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        SampleFormat::F32 => build_input_stream_for::<f32, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        SampleFormat::F64 => build_input_stream_for::<f64, R>(
            app,
            device,
            config,
            channels,
            input_sample_rate,
            mixer,
        ),
        format => Err(format!("Unsupported input sample format: {format}")),
    }
}

fn build_input_stream_for<T, R: Runtime>(
    app: AppHandle<R>,
    device: &cpal::Device,
    config: StreamConfig,
    channels: usize,
    input_sample_rate: u32,
    mixer: Arc<Mutex<Mixer>>,
) -> Result<Stream, String>
where
    T: SizedSample + Sample,
    f32: FromSample<T>,
{
    let err_app = app.clone();
    device
        .build_input_stream(
            config,
            move |data: &[T], _| {
                let samples = data
                    .iter()
                    .copied()
                    .map(f32::from_sample)
                    .collect::<Vec<_>>();
                mixer
                    .lock()
                    .push_input_samples(&samples, channels, input_sample_rate);
            },
            move |err| emit_engine_error(&err_app, format!("Audio input stream error: {err}")),
            None,
        )
        .map_err(|e| e.to_string())
}

fn emit_engine_error<R: Runtime>(app: &AppHandle<R>, message: String) {
    let _ = app.emit("audio-engine-error", AudioEngineEvent { message });
}
