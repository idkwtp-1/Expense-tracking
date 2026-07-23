import subprocess
import time
import sys
import os
import signal
import socket
import ctypes

# Set unique AppUserModelID so the app groups independently on the Windows taskbar
# (not under python.exe or pythonw.exe)
if sys.platform == "win32":
    try:
        myappid = 'slplayer.expense.desktop.v1'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except Exception as e:
        print(f"[SLPLAYER] AppUserModelID setup warning: {e}")

import webview

def wait_for_port(port, timeout=20):
    """Poll until the local dev server is accepting connections."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            # Check localhost (which handles both IPv4 127.0.0.1 and IPv6 ::1)
            with socket.create_connection(("localhost", port), timeout=0.5):
                return True
        except (socket.timeout, ConnectionRefusedError, socket.gaierror):
            time.sleep(0.3)
    return False


def main():
    print("[SLPLAYER] Booting SLPlayer desktop client...")

    script_dir = os.path.dirname(os.path.abspath(__file__))

    # CREATE_NO_WINDOW flag prevents any CMD flash on Windows
    creation_flags = 0
    if sys.platform == "win32":
        creation_flags = 0x08000000

    # --- 1. Start Vite dev server silently in the background ---
    # Using cmd /c ensures npm/node are found via the full Windows shell PATH
    
    log_dir = os.path.join(script_dir, "logs")
    os.makedirs(log_dir, exist_ok=True)
    vite_log = open(os.path.join(log_dir, "vite_server.log"), "w")
    
    # Detect if we have a production build available.
    # Serving production preview is virtually instant and performs much better.
    client_html = os.path.join(script_dir, "dist", "client", "index.html")
    use_prod = os.path.exists(client_html)

    vite_proc = None
    try:
        if use_prod:
            print("[SLPLAYER] Starting production preview server on port 5173...")
            vite_cmd = "cmd /c npm run preview"
        else:
            print("[SLPLAYER] Starting Vite dev server on port 5173...")
            vite_cmd = "cmd /c npm run dev"

        vite_proc = subprocess.Popen(
            vite_cmd,
            cwd=script_dir,
            shell=False,
            stdout=vite_log,
            stderr=vite_log,
            creationflags=creation_flags
        )
    except Exception as e:
        print(f"[ERROR] Failed to start Vite server: {e}")
        if sys.platform == "win32":
            ctypes.windll.user32.MessageBoxW(
                0,
                f"Failed to start the SLPlayer server:\n{e}",
                "SLPLAYER — SYSTEM ERROR",
                16
            )
        sys.exit(1)

    # --- 2. Wait for Vite to be ready ---
    print("[SLPLAYER] Waiting for server to initialize...")
    if not wait_for_port(5173, timeout=20):
        print("[ERROR] Vite server did not respond on port 5173 within timeout.")
        if sys.platform == "win32":
            ctypes.windll.user32.MessageBoxW(
                0,
                "SLPlayer server failed to start on port 5173.\nPlease ensure Node.js and npm are installed.",
                "SLPLAYER — INITIALIZATION FAILED",
                16
            )
        if vite_proc:
            vite_proc.terminate()
        sys.exit(1)

    # --- 3. Launch native pywebview window ---
    print("[SLPLAYER] Launching native window...")
    try:
        window = webview.create_window(
            title="SLPlayer",
            url="http://localhost:5173",
            width=1280,
            height=800,
            min_size=(430, 700),
            fullscreen=True,
            resizable=True,
            background_color='#09090b',  # matches app dark background
            hidden=True                   # reveal only after page has loaded
        )

        def on_loaded():
            window.show()

        window.events.loaded += on_loaded

        # --- Set Custom Taskbar / Window Icon ---
        def set_custom_icon(*args):
            if sys.platform == "win32":
                try:
                    import clr
                    clr.AddReference('System.Drawing')
                    from System.Drawing import Icon
                    icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Expense tracking.ico")
                    if os.path.exists(icon_path):
                        # 1. Update WinForms Form Icon
                        window.native.Icon = Icon(icon_path)
                        
                        # 2. Send WM_SETICON message to hWnd for Alt+Tab and taskbar refresh
                        hwnd = int(window.native.Handle)
                        WM_SETICON = 0x0080
                        ICON_BIG = 1
                        ICON_SMALL = 0
                        IMAGE_ICON = 1
                        LR_LOADFROMFILE = 0x00000010
                        
                        user32 = ctypes.windll.user32
                        h_icon = user32.LoadImageW(
                            None,
                            icon_path,
                            IMAGE_ICON,
                            0, 0,
                            LR_LOADFROMFILE
                        )
                        if h_icon:
                            user32.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, h_icon)
                            user32.SendMessageW(hwnd, WM_SETICON, ICON_BIG, h_icon)
                except Exception as ex:
                    print("[SLPLAYER] Failed to set custom window icon:", ex)

        window.events.before_show += set_custom_icon

        # Start the GUI event loop — blocks here until the window is closed
        webview.start(debug=False, private_mode=False)

    finally:
        # --- 4. Clean up: kill the Vite server when the window closes ---
        print("[SLPLAYER] Window closed. Terminating Vite server...")
        if vite_proc:
            if sys.platform == "win32":
                subprocess.Popen(
                    f"taskkill /F /T /PID {vite_proc.pid}",
                    shell=True,
                    creationflags=creation_flags
                )
            else:
                os.killpg(os.getpgid(vite_proc.pid), signal.SIGTERM)
        print("[SLPLAYER] Goodbye.")


if __name__ == "__main__":
    main()
