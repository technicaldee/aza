# Sound Machine Module

This folder contains the device-side software for the AZA sound device.

## Goal

The sound device is a simple GSM-enabled module with:

- a SIM card
- a small controller board
- a speaker connected over AUX
- external power from the speaker or board power rail

Whenever the AZA backend sends an SMS like:

`You have received 200 Naira from Emmanuel John`

the device watches for unread SMS messages, reads the message body, and speaks it out loud through the attached speaker.

## Recommended hardware shape

The Python version in this folder is best suited for:

- Raspberry Pi
- Orange Pi
- any small Linux SBC
- a USB GSM modem or serial GSM module that exposes AT commands

Typical stack:

1. GSM modem receives SMS on the synced sound-device phone number.
2. This Python service polls unread SMS messages over serial AT commands.
3. The service extracts the SMS body.
4. The service speaks the message through the local audio output.
5. The SMS is deleted after playback to avoid repeats.

## Files

- `sms_reader.py`
  Main process that:
  - initializes the GSM modem
  - polls unread SMS
  - extracts message text
  - speaks the message
  - deletes processed messages

- `requirements.txt`
  Python dependencies for the Linux SBC version.

- `.env.example`
  Runtime configuration for serial port, voice, and polling.

## Quick start

1. Connect the GSM modem to the board.
2. Insert the SIM card for the sound device.
3. Connect audio output from the board to the speaker AUX input.
4. Install Python dependencies:

```bash
pip install -r requirements.txt
```

5. Copy the env file:

```bash
cp .env.example .env
```

6. Update serial settings if needed.

7. Run:

```bash
python sms_reader.py
```

## Environment variables

- `SOUND_MACHINE_SERIAL_PORT`
  Serial device path, for example `/dev/ttyUSB0`

- `SOUND_MACHINE_BAUD_RATE`
  Serial baud rate, for example `115200`

- `SOUND_MACHINE_POLL_SECONDS`
  How often the device checks for unread SMS

- `SOUND_MACHINE_TTS_RATE`
  Speech speed for playback

- `SOUND_MACHINE_TTS_VOLUME`
  Playback volume from `0.0` to `1.0`

- `SOUND_MACHINE_DELETE_AFTER_READ`
  `true` to delete an SMS after playback

## Notes for embedded migration

If you later move this from Python on a Linux SBC to a tighter embedded board:

- keep the same GSM AT command flow
- replace Python serial access with UART access in C/C++ or MicroPython
- replace the TTS engine with:
  - a local speech IC
  - a pre-recorded audio bank
  - or a dedicated TTS module

The core logic remains the same:

1. check unread SMS
2. read body
3. play speech
4. delete or mark as read

## Operational reminder

The backend sends SMS alerts to the synced sound-device number using Termii. The device does not need to know anything about AZA transactions directly; it only needs to receive and speak SMS messages.
