/*
Date: 2016-02-10 20:23:31
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for GPS_DATA
-- ----------------------------
DROP TABLE IF EXISTS `GPS_DATA`;
CREATE TABLE `GPS_DATA` (
  `timestamp` datetime NOT NULL,
  `savetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `latitude` int(11) NOT NULL,
  `longitude` int(11) NOT NULL,
  `altitude` int(11) DEFAULT NULL,
  `angle` int(11) DEFAULT NULL,
  `sattelites` int(11) DEFAULT NULL,
  `speed` int(11) DEFAULT NULL,
  PRIMARY KEY (`timestamp`,`longitude`,`latitude`),
  UNIQUE KEY `timestamp_idx` (`timestamp`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for IMEI_ALLOW
-- ----------------------------
DROP TABLE IF EXISTS `IMEI_ALLOW`;
CREATE TABLE `IMEI_ALLOW` (
  `imei` varchar(15) NOT NULL,
  `allow` tinyint(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for IO_DATA_1
-- ----------------------------
DROP TABLE IF EXISTS `IO_DATA_1`;
CREATE TABLE `IO_DATA_1` (
  `timestamp` datetime NOT NULL,
  `id` int(11) NOT NULL,
  `value` tinyint(4) unsigned NOT NULL,
  PRIMARY KEY (`timestamp`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for IO_DATA_2
-- ----------------------------
DROP TABLE IF EXISTS `IO_DATA_2`;
CREATE TABLE `IO_DATA_2` (
  `timestamp` datetime NOT NULL,
  `id` int(11) NOT NULL,
  `value` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`timestamp`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for IO_DATA_4
-- ----------------------------
DROP TABLE IF EXISTS `IO_DATA_4`;
CREATE TABLE `IO_DATA_4` (
  `timestamp` datetime NOT NULL,
  `id` int(11) NOT NULL,
  `value` int(10) unsigned NOT NULL,
  PRIMARY KEY (`timestamp`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for IO_DATA_8
-- ----------------------------
DROP TABLE IF EXISTS `IO_DATA_8`;
CREATE TABLE `IO_DATA_8` (
  `timestamp` datetime NOT NULL,
  `id` int(11) NOT NULL,
  `value` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`timestamp`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
