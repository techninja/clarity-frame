import { WebSocketServer } from 'ws';
import dgram from 'dgram';
import fetch from 'node-fetch';

const wss = new WebSocketServer({ port: 3001 });
const udpClient = dgram.createSocket('udp4');

let wledIP = '192.168.1.100';
let ledCount = 256;

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'config') {
                wledIP = data.ip;
                ledCount = data.ledCount;
                console.log(`Configured for WLED at ${wledIP} with ${ledCount} LEDs`);
            }
            
            if (data.type === 'pixels') {
                sendDDPPacket(data.data);
            }
        } catch (e) {
            console.error('Invalid message:', e);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

let ddpEnabled = false;

async function enableDDP() {
    if (ddpEnabled) return;
    
    try {
        // First, turn on WLED and disable effects
        const stateResponse = await fetch(`http://${wledIP}/json/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                on: true, 
                bri: 255, 
                seg: [{ fx: 0, col: [[0,0,0]] }] 
            })
        });
        
        // Enable DDP input in settings
        const configResponse = await fetch(`http://${wledIP}/json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                if: { 
                    live: { 
                        en: true,
                        port: 4048,
                        mc: false
                    }
                }
            })
        });
        
        console.log('WLED configured for DDP:', stateResponse.status, configResponse.status);
        ddpEnabled = true;
    } catch (err) {
        console.error('Failed to configure WLED:', err);
    }
}

let lastPixelData = null;
let sendInterval = null;

function sendDDPPacket(pixels) {
    enableDDP();
    
    // Ensure we have data for all LEDs
    const fullPixels = new Array(ledCount).fill(null).map((_, i) => 
        pixels[i] || { r: 0, g: 0, b: 0 }
    );
    
    lastPixelData = fullPixels;
    
    // Clear existing interval and start new one
    if (sendInterval) clearInterval(sendInterval);
    
    // Send immediately
    sendDDPData(fullPixels);
    
    // Continue sending every 50ms to maintain control
    sendInterval = setInterval(() => {
        if (lastPixelData) sendDDPData(lastPixelData);
    }, 50);
    
    // Stop after 5 seconds if no new data
    setTimeout(() => {
        if (sendInterval) {
            clearInterval(sendInterval);
            sendInterval = null;
        }
    }, 5000);
}

function sendDDPData(pixels) {
    const dataLength = ledCount * 3;
    const packet = Buffer.alloc(10 + dataLength);
    
    // DDP Header (10 bytes)
    packet[0] = 0x41;  // Flags: VER=1, TIMECODE=0, STORAGE=0, REPLY=0, QUERY=0, PUSH=1
    packet[1] = 0x00;  // Sequence
    packet[2] = 0x01;  // Data type: RGB
    packet[3] = 0x00;  // Source/Dest ID
    packet.writeUInt32BE(0, 4);  // Data offset
    packet.writeUInt16BE(dataLength, 8);  // Data length
    
    // RGB Data for all LEDs
    for (let i = 0; i < ledCount; i++) {
        const offset = 10 + i * 3;
        packet[offset] = pixels[i].r;
        packet[offset + 1] = pixels[i].g;
        packet[offset + 2] = pixels[i].b;
    }
    
    udpClient.send(packet, 4048, wledIP, (err) => {
        if (err) console.error('UDP send error:', err);
    });
}

console.log('DDP Proxy server running on port 3001');