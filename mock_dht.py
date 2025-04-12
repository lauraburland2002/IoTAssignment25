import random
import time

try:
    import Adafruit_DHT
except ImportError:
    print("Adafruit_DHT library not found. Install it using 'pip install Adafruit_DHT'.")

# Mock function to simulate sensor data
def mock_sensor_data():
    """
    Simulates temperature data.
    Returns:
        tuple: temperature (float)
    """
    temperature = round(random.uniform(20.0, 30.0), 2)  # Random temperature between 20°C and 30°C
    return temperature

def main():
    # Using a mock function for data simulation
    print("Starting mock IoT data simulation...")

    while True:
        # Simulate sensor data
        temperature = mock_sensor_data()

        # Display the simulated values
        print(f"Temperature: {temperature}°C")

        # Simulate data transmission delay
        time.sleep(2)

if __name__ == "__main__":
    main()
