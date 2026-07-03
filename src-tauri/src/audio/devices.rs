use std::str::FromStr;

use cpal::traits::{DeviceTrait, HostTrait};
use cpal::DeviceId;
use serde::Serialize;

const BLACKHOLE_INSTALL_URL: &str = "https://existential.audio/blackhole/";
const VB_CABLE_INSTALL_URL: &str = "https://vb-audio.com/Cable/";
const PIPEWIRE_GUIDE_URL: &str = "https://pipewire.org/";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDeviceInfo {
    pub id: String,
    pub label: String,
    pub is_default: bool,
    pub is_virtual: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevices {
    pub inputs: Vec<AudioDeviceInfo>,
    pub outputs: Vec<AudioDeviceInfo>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VirtualCableStatus {
    /// The virtual cable is visible to CoreAudio and can be selected now.
    pub installed: bool,
    /// The platform driver package is present on disk (macOS HAL plugin, etc.).
    pub driver_installed: bool,
    pub device_id: Option<String>,
    pub label: Option<String>,
    pub install_url: String,
    pub platform: String,
    pub guidance: String,
}

pub fn list_audio_devices() -> Result<AudioDevices, String> {
    let host = cpal::default_host();
    let default_input_id = default_device_id(host.default_input_device());
    let default_output_id = default_device_id(host.default_output_device());

    let inputs = host
        .input_devices()
        .map_err(|e| e.to_string())?
        .filter_map(|device| device_info(device, default_input_id.as_deref()))
        .collect();

    let outputs = host
        .output_devices()
        .map_err(|e| e.to_string())?
        .filter_map(|device| device_info(device, default_output_id.as_deref()))
        .collect();

    Ok(AudioDevices { inputs, outputs })
}

pub fn detect_virtual_cable() -> Result<VirtualCableStatus, String> {
    let devices = list_audio_devices()?;
    let platform = std::env::consts::OS.to_string();
    let candidate = find_virtual_output(&devices.outputs);
    let driver_installed = is_virtual_cable_driver_present();
    let installed = candidate.is_some();

    let (install_url, default_guidance) = platform_virtual_cable_info();
    let guidance = if installed {
        default_guidance.to_string()
    } else if driver_installed {
        driver_pending_guidance()
    } else {
        default_guidance.to_string()
    };

    Ok(VirtualCableStatus {
        installed,
        driver_installed,
        device_id: candidate.map(|device| device.id.clone()),
        label: candidate.map(|device| device.label.clone()),
        install_url: install_url.to_string(),
        platform,
        guidance,
    })
}

pub fn output_device_by_id(id: Option<&str>) -> Result<cpal::Device, String> {
    device_by_id(id, true)
}

pub fn input_device_by_id(id: Option<&str>) -> Result<Option<cpal::Device>, String> {
    match id {
        Some(value) => device_by_id(Some(value), false).map(Some),
        None => Ok(cpal::default_host().default_input_device()),
    }
}

fn device_by_id(id: Option<&str>, output: bool) -> Result<cpal::Device, String> {
    let host = cpal::default_host();

    if let Some(value) = id {
        if let Ok(device_id) = DeviceId::from_str(value) {
            if let Some(device) = host.device_by_id(&device_id) {
                return Ok(device);
            }
        }
    }

    let default = if output {
        host.default_output_device()
    } else {
        host.default_input_device()
    };

    default.ok_or_else(|| {
        if output {
            "No output audio device is available".to_string()
        } else {
            "No input audio device is available".to_string()
        }
    })
}

fn default_device_id(device: Option<cpal::Device>) -> Option<String> {
    device.and_then(|device| device.id().ok().map(|id| id.to_string()))
}

fn find_virtual_output(outputs: &[AudioDeviceInfo]) -> Option<&AudioDeviceInfo> {
    outputs.iter().find(|device| is_virtual_cable_label(&device.label))
}

fn is_virtual_cable_label(label: &str) -> bool {
    let lower = label.to_lowercase();
    lower.contains("blackhole")
        || lower.contains("black hole")
        || lower.contains("cable input")
        || lower.contains("micdrop")
}

fn platform_virtual_cable_info() -> (&'static str, &'static str) {
    match std::env::consts::OS {
        "macos" => (
            BLACKHOLE_INSTALL_URL,
            "Install BlackHole 2ch, then choose it as MicDrop's virtual output and as your call app microphone.",
        ),
        "windows" => (
            VB_CABLE_INSTALL_URL,
            "Install VB-Cable, then choose CABLE Input as MicDrop's virtual output and CABLE Output as your call app microphone.",
        ),
        "linux" => (
            PIPEWIRE_GUIDE_URL,
            "Use PipeWire with a null sink or virtual source; MicDrop detects matching virtual outputs when present.",
        ),
        _ => (
            BLACKHOLE_INSTALL_URL,
            "Install a virtual audio cable supported by your operating system, then select it as MicDrop's routed output.",
        ),
    }
}

fn driver_pending_guidance() -> String {
    match std::env::consts::OS {
        "macos" => "BlackHole is installed but macOS has not loaded it yet. Quit and reopen MicDrop, or log out and sign back in. If it still does not appear, restart your Mac and click Refresh.".to_string(),
        "windows" => "VB-Cable appears installed but is not available yet. Reopen MicDrop or restart your PC, then click Refresh.".to_string(),
        _ => "The virtual audio driver is installed but not active yet. Restart MicDrop or your computer, then click Refresh.".to_string(),
    }
}

fn is_virtual_cable_driver_present() -> bool {
    #[cfg(target_os = "macos")]
    {
        const HAL_PLUGINS: &str = "/Library/Audio/Plug-Ins/HAL";
        return ["BlackHole2ch.driver", "BlackHole16ch.driver", "BlackHole64ch.driver"]
            .iter()
            .any(|name| std::path::Path::new(HAL_PLUGINS).join(name).exists());
    }

    #[cfg(target_os = "windows")]
    {
        return false;
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        false
    }
}

fn device_info(device: cpal::Device, default_id: Option<&str>) -> Option<AudioDeviceInfo> {
    let id = device.id().ok()?.to_string();
    let description = device.description().ok()?;
    let label = description.name().to_string();
    let lower_label = label.to_lowercase();

    Some(AudioDeviceInfo {
        is_default: default_id == Some(id.as_str()),
        is_virtual: description.device_type() == cpal::DeviceType::Virtual
            || is_virtual_cable_label(&label)
            || lower_label.contains("pipewire")
            || lower_label.contains("monitor"),
        id,
        label,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_blackhole_labels() {
        assert!(is_virtual_cable_label("BlackHole 2ch"));
        assert!(is_virtual_cable_label("BLACKHOLE 16CH"));
        assert!(is_virtual_cable_label("CABLE Input (VB-Audio Virtual Cable)"));
        assert!(!is_virtual_cable_label("MacBook Pro Speakers"));
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn detect_reports_hal_driver_when_plugin_present() {
        if !std::path::Path::new("/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver").exists() {
            return;
        }

        let status = detect_virtual_cable().expect("detect");
        assert!(status.driver_installed);
    }
}
