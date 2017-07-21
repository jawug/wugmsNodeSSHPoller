# wugmsNodeSSHPoller
WUGMS Node SSH Poller

## Details

This application listens on a configured port for requests for pre-configured services.

The request will take the form of http://<server_ip>:<configured_port>/<service_name>/<target_ip> 

example http://localhost:9000/arp/192.168.1.1