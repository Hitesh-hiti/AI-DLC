import json
import sys
import time
import pyautogui
import pyperclip
import win32con
import win32gui


def find_kiro_window():
    windows = []

    def callback(hwnd, _):
        if not win32gui.IsWindowVisible(hwnd):
            return

        title = win32gui.GetWindowText(hwnd)

        if title and "Kiro" in title:
            windows.append(hwnd)

    win32gui.EnumWindows(callback, None)

    return windows[0] if windows else None


def activate_kiro():
    hwnd = find_kiro_window()

    if hwnd is None:
        raise RuntimeError("Kiro window not found.")

    if win32gui.IsIconic(hwnd):
        win32gui.ShowWindow(
            hwnd,
            win32con.SW_RESTORE,
        )
        time.sleep(1)

    print(
        "[Kiro] Window found/restored.",
        flush=True,
    )

    return hwnd


def focus_chat_input():
    print("Opening Kiro Command Palette...", flush=True)

    pyautogui.hotkey(
        "ctrl",
        "shift",
        "p",
    )

    time.sleep(1)

    print(
        "Kiro: Focus chat input",
        flush=True,
    )

    pyautogui.write(
        "Kiro: Focus chat input",
        # interval=0.03,
    )

    time.sleep(1)

    pyautogui.press("enter")

    time.sleep(0.8)


def send_to_kiro(payload):
    responder = payload.get("responderName", "").strip()
    timestamp = payload.get("replyTimestampIso", "").strip()
    answer = payload.get("answer", "").strip()

    if not answer:
        raise ValueError("Human response is empty.")

    message = (
        f"Replied by: {responder}\n"
        f"Timestamp: {timestamp}\n"
        f"Answer: {answer}"
    )

    activate_kiro()

    focus_chat_input()

    print("Pasting Slack response...", flush=True)

    pyperclip.copy(message)

    pyautogui.hotkey(
        "ctrl",
        "v",
    )

    time.sleep(0.5)

    print("Sending...", flush=True)

    pyautogui.press("enter")

    time.sleep(1)

    print("DONE", flush=True)


def main():
    print(
        "kiro-input.py started.",
        flush=True,
    )

    for line in sys.stdin:
        line = line.strip()

        if not line:
            continue

        try:
            payload = json.loads(line)

            if not isinstance(payload, dict):
                raise ValueError(
                    "Input JSON must be an object."
                )

            send_to_kiro(payload)

        except Exception as exc:
            print(
                f"ERROR: {type(exc).__name__}: {exc}",
                file=sys.stderr,
                flush=True,
            )

            sys.exit(1)


if __name__ == "__main__":
    main()
