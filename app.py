from backend.app import app

if __name__ == '__main__':
    print("Starting Ethereum Slot Visualization API server from root app.py")
    app.run(debug=True, host='0.0.0.0', port=5000) 