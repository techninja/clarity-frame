# Kiosk Mode Debug Commands

## 1. Check systemd service status
```bash
sudo systemctl status photo-frame.service
```

## 2. View service logs
```bash
sudo journalctl -u photo-frame.service -f
```

## 3. Check if service is enabled
```bash
sudo systemctl is-enabled photo-frame.service
```

## 4. Manual service test
```bash
sudo systemctl start photo-frame.service
```

## 5. Check autostart file exists
```bash
ls -la ~/.config/lxsession/LXDE-pi/autostart
cat ~/.config/lxsession/LXDE-pi/autostart
```

## 6. Test if GUI autostart would work (if desktop was enabled)
```bash
# Check if X11 is available
echo $DISPLAY
# Check desktop environment
echo $DESKTOP_SESSION
```