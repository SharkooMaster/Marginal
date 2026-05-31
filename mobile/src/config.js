// ---------------------------------------------------------------------------
// Set this to where your Django backend is reachable from the device/emulator.
//
//   - Web / iOS simulator:        http://127.0.0.1:8200
//   - Android emulator:           http://10.0.2.2:8200
//   - Physical phone (Expo Go):   http://<YOUR-COMPUTER-LAN-IP>:8200
//                                 (e.g. http://192.168.1.42:8200)
//   - External / public network:  http://92.34.179.144:8200
// ---------------------------------------------------------------------------
// NOTE: backend runs on 8200 because 8000 was already occupied. To be reachable
// from an external network the Django server must bind to 0.0.0.0:8200 and the
// router/firewall must forward TCP 8200 to this machine.
export const API_BASE_URL = "http://92.34.179.144:8200/api";
