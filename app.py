#!/usr/bin/env python3
"""
Flask wrapper for VaultGuard Node.js application
This allows deployment using the Flask deployment system
"""

from flask import Flask, request, jsonify
import subprocess
import os
import signal
import atexit
import time
import requests

app = Flask(__name__)

# Global variable to store the Node.js process
node_process = None

def start_node_server():
    """Start the Node.js server"""
    global node_process
    
    # Set environment variables
    env = os.environ.copy()
    env.update({
        'DATABASE_URL': 'postgresql://postgres:password@localhost:5432/vaultguard_test',
        'ENCRYPTION_KEY': '12345678901234567890123456789012',
        'SESSION_SECRET': 'production-session-secret-key',
        'NODE_ENV': 'production',
        'PORT': '3001',
        'HOST': '0.0.0.0'
    })
    
    # Start the Node.js server
    node_process = subprocess.Popen(
        ['node', 'dist/index.js'],
        cwd='/home/ubuntu/vaultguard-enhanced',
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for the server to start
    time.sleep(3)
    
    return node_process

def stop_node_server():
    """Stop the Node.js server"""
    global node_process
    if node_process:
        node_process.terminate()
        node_process.wait()

# Start Node.js server when Flask starts
start_node_server()

# Register cleanup function
atexit.register(stop_node_server)

@app.route('/')
def index():
    """Serve the main application"""
    try:
        response = requests.get('http://localhost:3001/', timeout=5)
        return response.content, response.status_code, dict(response.headers)
    except Exception as e:
        return f"VaultGuard is starting up... Please refresh in a moment. Error: {str(e)}", 503

@app.route('/<path:path>')
def proxy(path):
    """Proxy all requests to the Node.js server"""
    try:
        url = f'http://localhost:3001/{path}'
        
        if request.method == 'GET':
            response = requests.get(url, params=request.args, timeout=10)
        elif request.method == 'POST':
            response = requests.post(url, json=request.get_json(), params=request.args, timeout=10)
        elif request.method == 'PUT':
            response = requests.put(url, json=request.get_json(), params=request.args, timeout=10)
        elif request.method == 'DELETE':
            response = requests.delete(url, params=request.args, timeout=10)
        else:
            response = requests.request(request.method, url, timeout=10)
        
        return response.content, response.status_code, dict(response.headers)
    except Exception as e:
        return jsonify({'error': f'Service unavailable: {str(e)}'}), 503

@app.route('/health')
def health():
    """Health check endpoint"""
    try:
        response = requests.get('http://localhost:3001/api/health', timeout=5)
        return response.json(), response.status_code
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'message': 'VaultGuard backend is not responding'
        }), 503

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
