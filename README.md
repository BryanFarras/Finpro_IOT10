# README.md - IoT Wildfire Monitoring System

## 1. Introduction

The **IoT-based Forest and Land Fire Monitoring System** is a real-time environmental monitoring solution designed to detect early signs of wildfires using integrated sensors and a web-based dashboard. Developed as part of the Real-Time Systems and Internet of Things course at Universitas Indonesia, this system aims to address the recurring challenge of forest and land fires in Indonesia by providing timely, remote, and automated monitoring.

The system utilizes an **ESP32 microcontroller** to collect data from multiple environmental sensors, including:
- **DHT11** for temperature and humidity
- **MQ-2** for smoke and flammable gas detection
- **Flame Sensor** for fire detection
- **GPS Module** for device location tracking

Data is transmitted via **MQTT** to a **Node-RED** backend and visualized through a **React-based dashboard**, enabling real-time monitoring and early intervention.

---

## 2. Implementation

### 2.1 Hardware Design
The core hardware consists of an ESP32 microcontroller integrated with:
- **DHT11** (GPIO12)
- **MQ-2** (Analog GPIO34)
- **Flame Sensor** (GPIO13)
- **GPS Module** (UART: GPIO16-RX, GPIO17-TX)
- **Water Pump** (GPIO25) for automated fire response

All components are assembled on a breadboard with appropriate voltage and communication interfaces.

### 2.2 Software Development
The system is built on two layers:

- **ESP32 Firmware**: Developed in Arduino IDE (C++), using libraries such as:
  - `WiFi.h`, `PubSubClient.h`, `DHT.h`, `TinyGPSPlus.h`
  - Reads sensor data every 5 seconds
  - Publishes data to MQTT topics
  - Activates water pump upon fire detection

- **Backend & Dashboard**:
  - **Node-RED**: Receives MQTT data, processes it into JSON, stores locally, and provides REST APIs
  - **React Dashboard** (Vite): Fetches data from Node-RED, displays real-time sensor values, and shows device locations on OpenStreetMap

### 2.3 Integration
Hardware and software were integrated step-by-step, ensuring sensor readings, MQTT communication, and actuator control worked harmoniously. The system was tested in simulated fire conditions to validate functionality.

---

## 3. Testing and Evaluation

### 3.1 Testing Process
Testing was conducted to verify each acceptance criterion:

- **Individual Sensor Testing**: DHT11, MQ-2, and Flame Sensor were validated separately.
- **Integration Testing**: ESP32, Node-RED, and React dashboard were tested together.
- **Actuator Testing**: Water pump activation was tested in both safe and fire-alert conditions.

### 3.2 Results
- **DHT11**: Stable temperature and humidity readings
- **MQ-2**: Responsive to gas/smoke changes
- **Flame Sensor**: Quickly detected fire, triggered visual alerts
- **Data Transmission**: MQTT communication stable, dashboard updated in real-time
- **GPS Module**: Failed to obtain satellite fix; location data not displayed
- **Water Pump**: Activated on fire detection but inconsistently across tests

### 3.3 Evaluation
The system successfully:
- Monitors environmental parameters in real-time
- Displays data clearly on the dashboard
- Triggers visual alerts upon fire detection

Areas for improvement:
- GPS module functionality
- Water pump reliability
- Consistent actuator response

---

## 4. Conclusion

The ESP32-based wildfire monitoring system demonstrates a functional and scalable prototype for early fire detection using IoT technologies. It effectively integrates multiple sensors, wireless communication, and a user-friendly dashboard to provide real-time environmental monitoring.

While the system met most design goals, challenges remain with GPS localization and consistent pump activation. Future work should focus on stabilizing the actuator response and improving GPS integration to enhance system reliability for real-world deployment.

---

## 5. References

1. T. Suryana, "Antarmuka ublox NEO-6M GPS Module dengan NodeMCU ESP8266," *Jurnal Komputa Unikom*, 2021.
2. R. Santos, "ESP32 with NEO-6M GPS Module (Arduino IDE)," *Random Nerd Tutorials*.
3. Last Minute Engineers, "ESP32 Pinout Reference."
4. IEMRobotics, "Understanding MQ2 Gas Sensor."
5. GeeksforGeeks, "Introduction of Message Queue Telemetry Transport Protocol (MQTT)."
6. A1 Digital, "Why MQTT is relevant for businesses."
7. A. C. Jiji et al., "IOT Based Automatic Forest Fire Detection Based on Machine Learning Approach," *Annals of Forest Research*, 2022.
8. R. Mahaveerakannan et al., "An IoT based forest fire detection system using integration of cat swarm with LSTM model," *Computer Communications*, 2023.
9. H. Hesse et al., "The FIREfly Project: Forest fire monitoring and prevention using an UAV-based IOT system," University of Glasgow Singapore, 2023–2025.
