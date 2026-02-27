import subprocess
import threading
import sys
import os
import signal
import time

# Configuration
BACKEND_DIR = os.path.abspath("backend")
FRONTEND_DIR = os.path.abspath("frontend")

# Commands
# We'll try to find the python executable in the venv
if os.name == 'nt':  # Windows
    BACKEND_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
else:  # Linux/Mac
    BACKEND_PYTHON = os.path.join(BACKEND_DIR, "venv", "bin", "python")

# Fallback to system python if venv python doesn't exist
if not os.path.exists(BACKEND_PYTHON):
    BACKEND_PYTHON = "python3" if os.name != 'nt' else "python"

BACKEND_CMD = [BACKEND_PYTHON, "main.py"]
FRONTEND_CMD = ["npm", "run", "dev"]

# Colors for output
BLUE = '\033[94m'
CYAN = '\033[96m'
RED = '\033[91m'
NC = '\033[0m'

def log_output(pipe, prefix, color):
    try:
        while True:
            line = pipe.readline()
            if not line:
                break
            print(f"{color}{prefix}{NC} {line.strip()}")
    except Exception as e:
        print(f"Logging error: {e}")

def run_service(cmd, cwd, prefix, color):
    # Simplify Popen call
    kwargs = {
        'cwd': cwd,
        'stdout': subprocess.PIPE,
        'stderr': subprocess.STDOUT,
        'text': True,
        'bufsize': 1,
        'shell': (os.name == 'nt')
    }
    
    process = subprocess.Popen(cmd, **kwargs)
    
    thread = threading.Thread(target=log_output, args=(process.stdout, prefix, color))
    thread.daemon = True
    thread.start()
    
    return process

def cleanup(processes):
    print(f"\n{RED}Stopping TrustHire services...{NC}")
    for p in sorted(processes, key=lambda x: x.pid, reverse=True):
        if p.poll() is None:
            try:
                if os.name == 'nt':
                    subprocess.run(['taskkill', '/F', '/T', '/PID', str(p.pid)], capture_output=True)
                else:
                    # Try SIGTERM first
                    p.terminate()
                    try:
                        p.wait(timeout=2)
                    except subprocess.TimeoutExpired:
                        p.kill()
            except Exception as e:
                pass
    print(f"{BLUE}Done.{NC}")
    sys.exit(0)

def main():
    print(f"{BLUE}Starting TrustHire in integrated mode...{NC}")
    
    processes = []
    
    try:
        # Start Backend
        print(f"{BLUE}Starting Backend...{NC}")
        backend_proc = run_service(BACKEND_CMD, BACKEND_DIR, "[BACKEND]", BLUE)
        processes.append(backend_proc)
        
        # Check if backend died immediately
        time.sleep(1.5)
        if backend_proc.poll() is not None:
            stdout_data, _ = backend_proc.communicate()
            print(f"{RED}Backend failed to start with code {backend_proc.returncode}{NC}")
            if stdout_data:
                print(f"Terminal Output:\n{stdout_data}")
            return

        # Start Frontend
        print(f"{CYAN}Starting Frontend...{NC}")
        frontend_proc = run_service(FRONTEND_CMD, FRONTEND_DIR, "[FRONTEND]", CYAN)
        processes.append(frontend_proc)
        
        print(f"\n{BLUE}Services are running.{NC}")
        print(f"Backend:  {BLUE}http://localhost:8000{NC}")
        print(f"Frontend: {CYAN}http://localhost:3000{NC}")
        print(f"Press {RED}Ctrl+C{NC} to stop both services.\n")
        
        while True:
            time.sleep(1)
            # Check if any process died
            if backend_proc.poll() is not None:
                print(f"{RED}Backend process exited unexpectedly with code {backend_proc.returncode}{NC}")
                break
            if frontend_proc.poll() is not None:
                print(f"{RED}Frontend process exited unexpectedly with code {frontend_proc.returncode}{NC}")
                break
                
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"{RED}Unexpected error: {e}{NC}")
    finally:
        cleanup(processes)

if __name__ == "__main__":
    main()
