use std::fs::File;
use std::path::Path;

use symphonia::core::codecs::audio::AudioDecoderOptions;
use symphonia::core::codecs::CodecParameters;
use symphonia::core::errors::Error;
use symphonia::core::formats::probe::Hint;
use symphonia::core::formats::{FormatOptions, TrackType};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;

#[derive(Debug, Clone)]
pub struct DecodedClip {
    pub samples: Vec<f32>,
    pub channels: usize,
    pub sample_rate: u32,
}

pub fn decode_clip(path: &str) -> Result<DecodedClip, String> {
    let src = File::open(path).map_err(|e| format!("Failed to open audio file: {e}"))?;
    let mss = MediaSourceStream::new(Box::new(src), Default::default());
    let mut hint = Hint::new();

    if let Some(extension) = Path::new(path).extension().and_then(|value| value.to_str()) {
        hint.with_extension(extension);
    }

    let mut format = symphonia::default::get_probe()
        .probe(
            &hint,
            mss,
            FormatOptions::default(),
            MetadataOptions::default(),
        )
        .map_err(|e| format!("Unsupported audio format: {e}"))?;

    let track = format
        .default_track(TrackType::Audio)
        .ok_or_else(|| "Audio file has no playable audio track".to_string())?;
    let track_id = track.id;
    let params = match track.codec_params.as_ref() {
        Some(CodecParameters::Audio(params)) => params.clone(),
        _ => return Err("Audio track is missing codec parameters".to_string()),
    };

    let mut decoder = symphonia::default::get_codecs()
        .make_audio_decoder(&params, &AudioDecoderOptions::default())
        .map_err(|e| format!("Unsupported audio codec: {e}"))?;

    let mut samples = Vec::new();
    let mut channels = params.channels.map(|value| value.count()).unwrap_or(1);
    let mut sample_rate = params.sample_rate.unwrap_or(48_000);

    loop {
        let packet = match format.next_packet() {
            Ok(Some(packet)) => packet,
            Ok(None) => break,
            Err(Error::ResetRequired) => continue,
            Err(Error::DecodeError(_)) => continue,
            Err(err) => return Err(format!("Failed to read audio packet: {err}")),
        };

        if packet.track_id != track_id {
            continue;
        }

        let decoded = match decoder.decode(&packet) {
            Ok(decoded) => decoded,
            Err(Error::DecodeError(_)) => continue,
            Err(err) => return Err(format!("Failed to decode audio packet: {err}")),
        };

        channels = decoded.spec().channels().count().max(1);
        sample_rate = decoded.spec().rate().max(1);
        let mut packet_samples: Vec<f32> = Vec::new();
        decoded.copy_to_vec_interleaved(&mut packet_samples);
        samples.extend(packet_samples);
    }

    if samples.is_empty() {
        return Err("Audio file decoded to zero samples".to_string());
    }

    Ok(DecodedClip {
        samples,
        channels,
        sample_rate,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn peak(samples: &[f32]) -> f32 {
        samples.iter().map(|sample| sample.abs()).fold(0.0, f32::max)
    }

    #[test]
    fn decodes_user_clip_files_when_present() {
        let paths = [
            "/Users/tomernorman/Downloads/snd_flowery_voiceclips/snd_flowery_voiceclip_your_dad.wav",
            "/Users/tomernorman/Downloads/58. Hammer of Justice (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3",
        ];

        let mut decoded_any = false;
        for path in paths {
            if !Path::new(path).exists() {
                continue;
            }
            let clip = decode_clip(path).unwrap_or_else(|err| panic!("decode failed for {path}: {err}"));
            eprintln!(
                "decoded {path}: samples={} channels={} rate={} peak={}",
                clip.samples.len(),
                clip.channels,
                clip.sample_rate,
                peak(&clip.samples)
            );
            assert!(clip.samples.len() > 1_000, "expected a full clip decode");
            assert!(peak(&clip.samples) > 0.01, "expected audible audio");
            decoded_any = true;
        }

        if !decoded_any {
            eprintln!("skip: no user clip files on disk");
        }
    }
}
