import os
import re
import time
from dataclasses import dataclass

import pyttsx3
import serial
from dotenv import load_dotenv


load_dotenv()


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name, str(default)).strip().lower()
    return value in {"1", "true", "yes", "on"}


SERIAL_PORT = os.getenv("SOUND_MACHINE_SERIAL_PORT", "/dev/ttyUSB0")
BAUD_RATE = int(os.getenv("SOUND_MACHINE_BAUD_RATE", "115200"))
POLL_SECONDS = float(os.getenv("SOUND_MACHINE_POLL_SECONDS", "4"))
TTS_RATE = int(os.getenv("SOUND_MACHINE_TTS_RATE", "175"))
TTS_VOLUME = float(os.getenv("SOUND_MACHINE_TTS_VOLUME", "1.0"))
DELETE_AFTER_READ = env_bool("SOUND_MACHINE_DELETE_AFTER_READ", True)


@dataclass
class SmsMessage:
    index: int
    sender: str
    timestamp: str
    body: str


class GsmModem:
    def __init__(self, port: str, baud_rate: int) -> None:
        self.serial = serial.Serial(port=port, baudrate=baud_rate, timeout=2)
        time.sleep(1.0)

    def command(self, text: str, pause: float = 0.4) -> str:
        self.serial.reset_input_buffer()
        self.serial.write((text + "\r").encode("utf-8"))
        time.sleep(pause)
        response = self.serial.read_all().decode("utf-8", errors="ignore")
        return response

    def initialize(self) -> None:
        self.command("AT")
        self.command("ATE0")
        self.command("AT+CMGF=1")
        self.command('AT+CPMS="SM","SM","SM"')

    def list_unread(self) -> list[SmsMessage]:
        response = self.command('AT+CMGL="REC UNREAD"', pause=1.0)
        return parse_sms_list(response)

    def delete_message(self, index: int) -> None:
        self.command(f"AT+CMGD={index}")


def parse_sms_list(raw: str) -> list[SmsMessage]:
    messages: list[SmsMessage] = []
    pattern = re.compile(
        r"\+CMGL:\s*(\d+),\"[^\"]*\",\"([^\"]*)\",(?:\"[^\"]*\",)?\"([^\"]*)\"\s*\r?\n(.*?)(?=\r?\n\+CMGL:|\r?\nOK|\Z)",
        re.DOTALL,
    )

    for match in pattern.finditer(raw):
        index = int(match.group(1))
        sender = match.group(2).strip()
        timestamp = match.group(3).strip()
        body = match.group(4).strip().replace("\r", "\n")

        if body:
            messages.append(SmsMessage(index=index, sender=sender, timestamp=timestamp, body=body))

    return messages


class Speaker:
    def __init__(self) -> None:
        self.engine = pyttsx3.init()
        self.engine.setProperty("rate", TTS_RATE)
        self.engine.setProperty("volume", TTS_VOLUME)

    def speak(self, text: str) -> None:
        print(f"[speak] {text}")
        self.engine.say(text)
        self.engine.runAndWait()


def main() -> None:
    print(f"Starting sound machine on {SERIAL_PORT} @ {BAUD_RATE}")
    modem = GsmModem(SERIAL_PORT, BAUD_RATE)
    modem.initialize()
    speaker = Speaker()

    while True:
        try:
            messages = modem.list_unread()

            for message in messages:
                print(
                    f"[sms] index={message.index} sender={message.sender} time={message.timestamp} body={message.body}"
                )
                speaker.speak(message.body)

                if DELETE_AFTER_READ:
                    modem.delete_message(message.index)

            time.sleep(POLL_SECONDS)
        except KeyboardInterrupt:
            print("Stopping sound machine.")
            break
        except Exception as error:
            print(f"[error] {error}")
            time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
