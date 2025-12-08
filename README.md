# Proyek Akhir IoT: Sistem Pemantauan Kebakaran Berbasis IoT

Repositori ini berisi seluruh deliverables proyek akhir mata kuliah **Praktikum IoT dan Sistem Waktu Nyata**, meliputi kode sumber, dokumentasi, laporan, serta file pendukung lainnya. Proyek ini mengimplementasikan sistem deteksi dini kebakaran berbasis ESP32 dengan sensor lingkungan dan dashboard monitoring real-time melalui Node-RED.

---

## GROUP 10

1. Nugroho Ulil Abshar - 2306229310
2. Grace Yunike Maragaretha Sitorus - 2306267031 
3. Muhammad Bryan Farras - 2306230975
4. Musyafa Iman Supriadi - 2306208464

---

# 1. Introduction

## 1.1 Latar Belakang & Permasalahan
Kebakaran hutan dan lahan merupakan masalah serius yang terjadi hampir setiap tahun di Indonesia. Menurut data BNPB pada Agustus 2023, ribuan hektar lahan mengalami kebakaran dan menyebabkan kerugian ekologis, ekonomi, serta kesehatan. Salah satu penyebab lambatnya penanganan adalah minimnya sistem pemantauan yang mampu memberikan informasi kondisi lingkungan secara real-time di area rawan kebakaran.

## 1.2 Solusi yang Diusulkan
Proyek ini mengembangkan **Sistem Pemantauan Kebakaran Berbasis IoT** menggunakan perangkat ESP32 yang terhubung dengan sensor DHT11, MQ-2, dan Flame Sensor. Perangkat mengirimkan data secara berkala melalui MQTT, kemudian Node-RED mengolah dan menampilkannya di dashboard interaktif. Sistem dilengkapi *water pump* otomatis yang aktif ketika flame sensor mendeteksi api, serta modul GPS (yang pada implementasi ini masih belum stabil).

## 1.3 Kriteria Keberhasilan
Proyek dinyatakan berhasil jika:
- Sensor DHT11 dapat membaca suhu & kelembapan secara stabil.  
- Sensor MQ-2 dapat membaca kadar gas secara kontinu.  
- Flame sensor dapat mendeteksi api dengan benar.  
- Data dapat dikirim ke MQTT dan tampil di dashboard Node-RED secara real-time.  
- Pompa air aktif otomatis saat flame terdeteksi (meski masih mengalami ketidakstabilan).    

---

# 2. Implementation

## 2.1 Desain Perangkat Keras
Perangkat keras utama:
- **ESP32 DevKit**
- **DHT11** (temperature & humidity)
- **MQ-2 Gas Sensor**
- **IR Flame Sensor**
- **Water Pump + Driver**
- **GPS NEO-6M** (masih belum stabil)
- **Power Supply 3.3V**

## 2.2 Pengembangan Perangkat Lunak
Software dikembangkan dengan Arduino IDE menggunakan bahasa C/C++. Fitur utama:
- Pembacaan sensor suhu, kelembapan, gas, dan api  
- Logika aktivasi pompa otomatis  
- Pengiriman data ke MQTT  
- Pembacaan GPS   
- Penanganan Wi-Fi & MQTT reconnect  

Dashboard Node-RED digunakan untuk:
- Menerima data sensor via MQTT  
- Menyimpan data ke file JSON  
- Menampilkan grafik & status real-time  

## 2.3 Integrasi Sistem
ESP32 mengirim data ke broker MQTT publik. Node-RED menerima data, memprosesnya, dan menampilkan informasi lewat dashboard. Sensor dan pompa diuji langsung melalui rangkaian fisik. GPS diuji namun belum mendapatkan *satellite fix* dengan stabil.

---

# 3. Testing and Evaluation

## 3.1 Skenario Pengujian
Pengujian dilakukan dalam dua kondisi utama:

1. **Flame SAFE** – Tidak ada api  
![Safe](https://hackmd.io/_uploads/r1YOca4Mbe.jpg)

2. **Flame ALERT** – Api didekatkan ke sensor  
![Alert](https://hackmd.io/_uploads/BJ-3wpNzbl.jpg)

Setiap kondisi diuji terhadap:
- Kestabilan pembacaan sensor  
- Respons pompa  
- Pengiriman data ke dashboard  
- Konsistensi data gas & suhu  

## 3.2 Hasil Pengujian

### Rangkaian
![Rangkaian](https://hackmd.io/_uploads/rJ0PLpEGbg.jpg)

### Dashboard Node-RED
![Dashboard](https://hackmd.io/_uploads/BJ-3wpNzbl.jpg)

Hasil pengujian menunjukkan:
- Sensor DHT11, MQ-2, dan flame berfungsi dengan baik  
- Dashboard Node-RED menampilkan data real-time  
- Pompa aktif ketika flame terdeteksi namun masih belum stabil  
- Modul GPS belum berhasil mendapatkan lokasi  

## 3.3 Evaluasi
- Semua sensor berfungsi baik dan responsif.  
- Pengiriman data ke MQTT berjalan stabil.  
- Dashboard bekerja real-time tanpa delay berarti.  
- Pompa masih kurang stabil dalam kondisi tertentu.  
- GPS belum dapat digunakan secara andal.  

---

# 4. Conclusion
Sistem Pemantauan Kebakaran Berbasis IoT ini berhasil dikembangkan sebagai prototipe yang mampu membaca kondisi lingkungan dan mendeteksi potensi kebakaran secara real-time. Integrasi sensor dan dashboard berjalan baik dan responsif. Walaupun stabilitas pompa dan modul GPS masih perlu penyempurnaan, sistem ini telah menunjukkan potensi untuk dikembangkan sebagai solusi monitoring kebakaran berbasis IoT yang praktis dan efektif.

---

# 5. Documentation

### Rangkaian
![Rangkaian](https://hackmd.io/_uploads/rJ0PLpEGbg.jpg)

### Dashboard Node-RED
![Dashboard](https://hackmd.io/_uploads/BJ-3wpNzbl.jpg)

![WhatsApp Image 2025-12-08 at 23.27.22_a843646e](https://hackmd.io/_uploads/ryJMspEGZx.jpg)
---

# 6. References

[1] T. Suryana, “Antarmuka ublox NEO-6M GPS Module dengan NodeMCU ESP8266,” Jurnal Komputa Unikom, 2021.  
[2] R. Santos, “ESP32 with NEO-6M GPS Module (Arduino IDE),” Random Nerd Tutorials.  
[3] Last Minute Engineers, “ESP32 Pinout Reference.”  
[4] IEMRobotics, “Understanding MQ2 Gas Sensor: A Guide for Beginners.”  
[5] GeeksforGeeks, “Introduction to MQTT.”  
[6] A1 Digital, “Why MQTT Is Relevant for Businesses.”  
[7] A. C. Jiji et al., “IoT Based Automatic Forest Fire Detection…,” Annals of Forest Research, 2022.  
[8] R. Mahaveerakannan et al., “IoT-based Forest Fire Detection…,” Computer Communications, 2023.  
[9] Hesse et al., “The FIREfly Project,” University of Glasgow Singapore, 2023–2025.  

---
