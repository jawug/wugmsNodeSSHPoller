CREATE TABLE `tbl_base_bgp_peers` (
  `rdate` datetime DEFAULT NULL,
  `host` varchar(60) DEFAULT NULL,
  `id` int(11) DEFAULT NULL,
  `name` varchar(60) DEFAULT NULL,
  `instance` varchar(60) DEFAULT NULL,
  `remote_address` varchar(60) DEFAULT NULL,
  `remote_as` varchar(60) DEFAULT NULL,
  `nexthop_choice` varchar(60) DEFAULT NULL,
  `in_filter` varchar(60) DEFAULT NULL,
  `out_filter` varchar(60) DEFAULT NULL,
  `remote_id` varchar(60) DEFAULT NULL,
  `local_address` varchar(60) DEFAULT NULL,
  `uptime` varchar(60) DEFAULT NULL,
  `prefix_count` varchar(60) DEFAULT NULL,
  `updates_sent` varchar(60) DEFAULT NULL,
  `updates_received` varchar(60) DEFAULT NULL,
  `withdrawn_sent` varchar(60) DEFAULT NULL,
  `withdrawn_received` varchar(60) DEFAULT NULL,
  `state` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE tbl_base_bgp_peers ADD PRIMARY KEY (rdate, host, id);


CREATE TABLE `tbl_base_ap_clients`
(
   `rdate`                     datetime NOT NULL,
   `host`                      varchar(60) NOT NULL,
   `interface`                 varchar(60) NOT NULL,
   `radio_name`                varchar(60) DEFAULT NULL,
   `mac_address`               varchar(60) NOT NULL,
   `ap`                        varchar(60) DEFAULT NULL,
   `wds`                       varchar(60) DEFAULT NULL,
   `bridge`                    varchar(60) DEFAULT NULL,
   `rx_rate`                   varchar(60) DEFAULT NULL,
   `tx_rate`                   varchar(60) DEFAULT NULL,
   `packets_tx`                int(11) NOT NULL DEFAULT '0',
   `packets_rx`                int(11) NOT NULL DEFAULT '0',
   `bytes_tx`                  int(11) NOT NULL DEFAULT '0',
   `bytes_rx`                  int(11) NOT NULL DEFAULT '0',
   `frames_tx`                 int(11) NOT NULL DEFAULT '0',
   `frames_rx`                 int(11) NOT NULL DEFAULT '0',
   `frame_bytes_tx`            int(11) NOT NULL DEFAULT '0',
   `frame_bytes_rx`            int(11) NOT NULL DEFAULT '0',
   `uptime`                    varchar(60) DEFAULT NULL,
   `last_activity`             varchar(60) DEFAULT NULL,
   `signal_strength`           varchar(60) DEFAULT NULL,
   `signal_to_noise`           varchar(60) DEFAULT NULL,
   `signal_strength_ch0`       int(11) NOT NULL DEFAULT '0',
   `signal_strength_ch1`       int(11) NOT NULL DEFAULT '0',
   `tx_signal_strength_ch0`    int(11) NOT NULL DEFAULT '0',
   `tx_signal_strength`        int(11) NOT NULL DEFAULT '0',
   `tx_ccq`                    int(11) NOT NULL DEFAULT '0',
   `rx_ccq`                    int(11) NOT NULL DEFAULT '0',
   `distance`                  varchar(60) DEFAULT NULL,
   `routeros_version`          varchar(60) DEFAULT NULL,
   `last_ip`                   varchar(60) DEFAULT NULL,
   `tx_rate_set`               varchar(60) DEFAULT NULL,
   `wmm_enabled`               varchar(60) DEFAULT NULL,
   PRIMARY KEY
      (`rdate`,
       `host`,
       `mac_address`),
   KEY `mac_addesses_idx` (`mac_address`, `host`, `interface`)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8;

CREATE TABLE `tbl_base_ip_arp`
(
   `rdate`          datetime DEFAULT CURRENT_TIMESTAMP,
   `host`           varchar(60) NOT NULL DEFAULT 'host',
   `address`        varchar(60) NOT NULL DEFAULT 'address',
   `mac_address`    varchar(60) NOT NULL DEFAULT 'mac_address',
   `interface`      varchar(60) NOT NULL DEFAULT 'interface',
   `published`      varchar(60) DEFAULT NULL,
   PRIMARY KEY
      (`rdate`,
       `host`,
       `address`,
       `mac_address`,
       `interface`),
   KEY `host_address_mac_address_idx` (`host`, `address`, `mac_address`)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8;


/********************/
CREATE TABLE `tbl_base_bgp_peers` (
  `rdate` datetime NOT NULL,
  `host` varchar(60) NOT NULL,
  `name` varchar(60) NOT NULL,
  `instance` varchar(60) NOT NULL,
  `remote_address` varchar(60) NOT NULL,
  `remote_as` varchar(60) NOT NULL,
  `tcp_md5_key` varchar(60) DEFAULT NULL,
  `nexthop_choice` varchar(60) DEFAULT NULL,
  `multihop` varchar(60) DEFAULT NULL,
  `route_reflect` varchar(60) DEFAULT NULL,
  `hold_time` varchar(60) DEFAULT NULL,
  `ttl` varchar(60) DEFAULT NULL,
  `in_filter` varchar(60) DEFAULT NULL,
  `out_filter` varchar(60) DEFAULT NULL,
  `address_families` varchar(60) DEFAULT NULL,
  `update_source` varchar(60) DEFAULT NULL,
  `default_originate` varchar(60) DEFAULT NULL,
  `remove_private_as` varchar(60) DEFAULT NULL,
  `as_override` varchar(60) DEFAULT NULL,
  `passive` varchar(60) DEFAULT NULL,
  `use_bfd` varchar(60) DEFAULT NULL,
  `remote_id` varchar(60) DEFAULT NULL,
  `local_address` varchar(60) DEFAULT NULL,
  `uptime` varchar(60) DEFAULT NULL,
  `prefix_count` varchar(60) DEFAULT NULL,
  `updates_sent` varchar(60) DEFAULT NULL,
  `updates_received` varchar(60) DEFAULT NULL,
  `withdrawn_sent` varchar(60) DEFAULT NULL,
  `withdrawn_received` varchar(60) DEFAULT NULL,
  `remote_hold_time` varchar(60) DEFAULT NULL,
  `used_hold_time` varchar(60) DEFAULT NULL,
  `used_keepalive_time` varchar(60) DEFAULT NULL,
  `refresh_capability` varchar(60) DEFAULT NULL,
  `as4_capability` varchar(60) DEFAULT NULL,
  `state` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`rdate`,`host`,`instance`,`remote_address`,`remote_as`,`name`),
  KEY `host_remote` (`host`,`remote_address`,`remote_as`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `tbl_base_ap_clients` (
  `rdate` datetime NOT NULL,
  `host` varchar(60) NOT NULL,
  `interface` varchar(60) NOT NULL,
  `radio_name` varchar(60) DEFAULT NULL,
  `mac_address` varchar(60) NOT NULL,
  `ap` varchar(60) DEFAULT '0',
  `wds` varchar(60) DEFAULT '0',
  `bridge` varchar(60) DEFAULT '0',
  `rx_rate` varchar(60) DEFAULT '0',
  `tx_rate` varchar(60) DEFAULT '0',
  `packets_tx` bigint(20) DEFAULT '0',
  `packets_rx` bigint(20) DEFAULT '0',
  `bytes_tx` bigint(20) DEFAULT '0',
  `bytes_rx` bigint(20) DEFAULT '0',
  `frames_tx` bigint(20) DEFAULT '0',
  `frames_rx` bigint(20) DEFAULT '0',
  `frame_bytes_tx` bigint(20) DEFAULT '0',
  `frame_bytes_rx` bigint(20) DEFAULT '0',
  `uptime` varchar(60) DEFAULT '0',
  `last_activity` varchar(60) DEFAULT '0',
  `signal_strength` varchar(60) DEFAULT '0',
  `signal_to_noise` varchar(60) DEFAULT '0',
  `signal_strength_ch0` int(11) DEFAULT '0',
  `signal_strength_ch1` int(11) DEFAULT '0',
  `tx_signal_strength_ch0` int(11) DEFAULT '0',
  `tx_signal_strength` int(11) DEFAULT '0',
  `tx_ccq` int(11) DEFAULT '0',
  `rx_ccq` int(11) DEFAULT '0',
  `distance` varchar(60) DEFAULT '0',
  `routeros_version` varchar(60) DEFAULT '0',
  `last_ip` varchar(60) DEFAULT '0',
  `tx_rate_set` varchar(60) DEFAULT '0',
  `wmm_enabled` varchar(60) DEFAULT 'no',
  PRIMARY KEY (`rdate`,`host`,`mac_address`),
  KEY `mac_addesses_idx` (`mac_address`,`host`,`interface`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `tbl_base_ip_arp` (
  `rdate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `host` varchar(60) NOT NULL DEFAULT 'host',
  `address` varchar(60) NOT NULL DEFAULT 'address',
  `mac_address` varchar(60) NOT NULL DEFAULT 'mac_address',
  `interface` varchar(60) NOT NULL DEFAULT 'interface',
  `published` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`rdate`,`host`,`address`,`mac_address`,`interface`),
  KEY `host_address_mac_address_idx` (`host`,`address`,`mac_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
