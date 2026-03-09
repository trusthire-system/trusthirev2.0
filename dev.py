import subprocess
import threading
import sys
import os
import shutil
import time

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Colors for output
BLUE = '\033[94m'
CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
NC = '\033[0m'

def print_step(message):
    print(f"\n{YELLOW}==>{NC} {message}")

def print_error(message):
    print(f"\n{RED}Error:{NC} {message}")

def print_success(message):
    print(f"{GREEN}==>{NC} {message}")

def kill_port_owner(port):
    """Kills the process listening on the specified port (Windows only)."""
    if os.name != 'nt': return
    try:
        output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode()
        for line in output.splitlines():
            if 'LISTENING' in line:
                pid = line.strip().split()[-1]
                if pid and pid != '0':
                    print(f"Cleaning up old process {pid} on port {port}...")
                    subprocess.run(f'taskkill /F /T /PID {pid}', shell=True, capture_output=True)
    except:
        pass

def cleanup_ports():
    print_step("Cleaning up ports 3000, 8000, 8001...")
    for port in [3000, 8000, 8001]:
        kill_port_owner(port)

def find_executable(name):
    """Finds the path to an executable across platforms."""
    if os.name == 'nt':
        for ext in ['.cmd', '.exe', '.bat']:
            cmd = shutil.which(name + ext)
            if cmd: return cmd
    return shutil.which(name) or name

def setup_backend():
    print_step("Checking Backend Setup...")
    if not os.path.exists(BACKEND_DIR):
        print_error(f"Backend directory not found at {BACKEND_DIR}")
        sys.exit(1)

    venv_dir = os.path.join(BACKEND_DIR, "venv")
    is_windows = os.name == 'nt'

    # Determine python and pip executables
    if is_windows:
        venv_python = os.path.join(venv_dir, "Scripts", "python.exe")
        venv_pip = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        venv_python = os.path.join(venv_dir, "bin", "python")
        venv_pip = os.path.join(venv_dir, "bin", "pip")

    # If venv doesn't exist, create it and install requirements
    if not os.path.exists(venv_dir) or not os.path.exists(venv_python):
        print_step("Virtual environment not found or incomplete. Creating it...")
        # Clean up any partial venv
        if os.path.exists(venv_dir):
            shutil.rmtree(venv_dir)
            
        python_cmd = sys.executable or find_executable("python3") or find_executable("python")
        try:
            subprocess.run([python_cmd, "-m", "venv", "venv"], cwd=BACKEND_DIR, check=True)
            print_success("Virtual environment created.")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to create virtual environment: {e}")
            sys.exit(1)

        req_file = os.path.join(BACKEND_DIR, "requirements.txt")
        if os.path.exists(req_file):
            print_step("Installing backend dependencies...")
            subprocess.run([venv_python, "-m", "pip", "install", "-r", "requirements.txt"], cwd=BACKEND_DIR, check=True)
            print_success("Backend dependencies installed.")
    else:
        print_success("Backend virtual environment already exists.")
        
    return venv_python

def setup_frontend():
    print_step("Checking Frontend Setup...")
    if not os.path.exists(FRONTEND_DIR):
        print_error(f"Frontend directory not found at {FRONTEND_DIR}")
        sys.exit(1)

    package_json = os.path.join(FRONTEND_DIR, "package.json")
    if not os.path.exists(package_json):
        print_error(f"package.json not found in frontend directory ({package_json}). Please make sure it exists.")
        sys.exit(1)

    npm_cmd = find_executable("npm")
    npx_cmd = find_executable("npx")
    
    if not shutil.which(npm_cmd) and not shutil.which("npm"):
        print_error("npm not found. Please install Node.js and npm.")
        sys.exit(1)

    node_modules_dir = os.path.join(FRONTEND_DIR, "node_modules")
    
    # Check if node_modules exists
    if not os.path.exists(node_modules_dir):
        print_step("node_modules not found. Installing frontend dependencies...")
        try:
            subprocess.run([npm_cmd, "--prefix", FRONTEND_DIR, "install"], cwd=FRONTEND_DIR, check=True)
            print_success("Frontend dependencies installed.")
            
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to install frontend dependencies: {e}")
            sys.exit(1)
    else:
        print_success("Frontend node_modules already exists.")

    # Check and sync Prisma only if client not already generated
    prisma_schema = os.path.join(FRONTEND_DIR, "prisma", "schema.prisma")
    prisma_client_dir = os.path.join(node_modules_dir, ".prisma", "client")
    prisma_db = os.path.join(FRONTEND_DIR, "prisma", "dev.db")
    
    if os.path.exists(prisma_schema) and npx_cmd:
        if not os.path.exists(prisma_client_dir) or not os.path.exists(prisma_db):
            print_step("Prisma client or database not found. Syncing database and generating client...")
            
            # 1. Push schema to database
            try:
                print_step("Running Prisma db push...")
                subprocess.run([npx_cmd, "prisma", "db", "push", "--accept-data-loss"], cwd=FRONTEND_DIR, check=True)
                print_success("Database schema synchronized.")
            except subprocess.CalledProcessError as e:
                print_error(f"Failed to push Prisma schema to database: {e}")
                # Non-fatal error, but we should warn the user

            # 2. Generate Client
            try:
                print_step("Generating Prisma client...")
                subprocess.run([npx_cmd, "prisma", "generate"], cwd=FRONTEND_DIR, check=True)
                print_success("Prisma client generated.")
            except subprocess.CalledProcessError as e:
                print_error(f"Failed to generate Prisma client: {e}")
        else:
            print_success("Prisma client already generated. Skipping database sync and generation.")

    return npm_cmd

def log_output(pipe, prefix, color):
    try:
        for line in iter(pipe.readline, ''):
            if not line:
                break
            print(f"{color}{prefix}{NC} {line.strip()}", flush=True)
    except Exception as e:
        # Ignore errors from closed pipes upon termination
        pass
    finally:
        try:
            pipe.close()
        except:
            pass

def run_service(cmd, cwd, prefix, color):
    kwargs = {
        'cwd': cwd,
        'stdout': subprocess.PIPE,
        'stderr': subprocess.STDOUT,
        'text': True,
        'bufsize': 1,
    }

    try:
        process = subprocess.Popen(cmd, **kwargs)
        thread = threading.Thread(target=log_output, args=(process.stdout, prefix, color))
        thread.daemon = True
        thread.start()
        return process
    except Exception as e:
        print_error(f"Failed to start service {prefix}: {e}")
        sys.exit(1)

def terminate_process(proc):
    if proc.poll() is None:
        try:
            if os.name == 'nt':
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)], 
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    proc.kill()
        except Exception:
            pass

def cleanup(processes):
    print(f"\n{YELLOW}Stopping TrustHire services...{NC}")
    for p in reversed(processes):
        terminate_process(p)
    print_success("All services stopped cleanly.")
    sys.exit(0)

def main():
    print(f"{BLUE}========================================{NC}")
    print(f"{BLUE}    TrustHire Automated Dev Environment {NC}")
    print(f"{BLUE}========================================{NC}")
    
    # 0. Cleanup ports
    cleanup_ports()
    
    run_prod = '--build' in sys.argv or '--prod' in sys.argv
    
    # 1. Setup Backend
    backend_python = setup_backend()
    
    # 2. Setup Frontend
    npm_cmd = setup_frontend()
    
    if run_prod:
        print_step("Building Frontend for production...")
        try:
            subprocess.run([npm_cmd, "--prefix", FRONTEND_DIR, "run", "build"], cwd=FRONTEND_DIR, check=True)
            print_success("Frontend build complete.")
        except subprocess.CalledProcessError as e:
            print_error(f"Frontend build failed: {e}")
            sys.exit(1)
            
    print_step("Starting services...")
    
    processes = []
    
    try:
        BACKEND_CMD = [backend_python, "main.py"]
        
        if run_prod:
            FRONTEND_CMD = [npm_cmd, "--prefix", FRONTEND_DIR, "run", "start"]
            server_type = "Production"
        else:
            FRONTEND_CMD = [npm_cmd, "--prefix", FRONTEND_DIR, "run", "dev"]
            server_type = "Development"
        
        # Start Backend
        print_step("Starting Backend...")
        backend_proc = run_service(BACKEND_CMD, BACKEND_DIR, "[BACKEND]", BLUE)
        processes.append(backend_proc)
        
        # Start Frontend
        print_step(f"Starting Frontend ({server_type})...")
        frontend_proc = run_service(FRONTEND_CMD, FRONTEND_DIR, "[FRONTEND]", CYAN)
        processes.append(frontend_proc)
        
        print(f"\n{GREEN}Both services are running!{NC}")
        print(f"Backend Server:  {BLUE}http://localhost:8001{NC} (or as configured in main.py)")
        print(f"Frontend Server: {CYAN}http://localhost:3000{NC} ({server_type})")
        print(f"Press {RED}Ctrl+C{NC} to stop both services.\n")
        
        # Monitor processes
        while True:
            time.sleep(1)
            b_rc = backend_proc.poll()
            f_rc = frontend_proc.poll()
             
            if b_rc is not None:
                print_error(f"Backend process exited unexpectedly (code {b_rc}).")
                break
            if f_rc is not None:
                print_error(f"Frontend process exited unexpectedly (code {f_rc}).")
                break
                
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Keyboard interrupt received.{NC}")
    except Exception as e:
        print_error(f"Unexpected error in main loop: {e}")
    finally:
        cleanup(processes)

if __name__ == "__main__":
    main()
