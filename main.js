var app_config = require('./settings.json');
var app_parsing_masks = require('./parsing_mask.json');
var log4js = require('log4js');
var Client = require('ssh2').Client;
var http = require("http");
var moment = require('moment');
var mysql = require('mysql');
var TrigDT;
var app_logger = log4js.getLogger('wugmsNodeSSHPoller');
var fs = require('fs');

log4js.configure(app_config.logger);

app_logger.info('Starting...');
Number.prototype.padLeft = function (base, chr) {
    var len = (String(base || 10).length - String(this).length) + 1;
    return len > 0 ? new Array(len).join(chr || '0') + this : this;
};

function ValidateIPaddress(ipaddress) {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
//    if (/^172\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
        return (true);
    }
    return (false);
}

function getDateTime() {
    var dt = new Date();
    var curr_year = dt.getFullYear();
    var curr_month = (dt.getMonth() + 1).padLeft();
    var curr_day = dt.getDate();
    var curr_hour = dt.getHours().padLeft();
    var curr_min = dt.getMinutes().padLeft();
    var curr_sec = dt.getSeconds().padLeft();
    var fdate = curr_year + "/" + curr_month + "/" + curr_day + " " + curr_hour + ":" + curr_min + ":00";
    return (fdate);
}

function checkProperty(item, namedarray) {
    if (item in namedarray) {
        return true;
    } else {
        return false;
    }
}

function getNumericValue(value) {
    var patt = /\d/g;
    if (patt.test(value)) {
        return value.replace(/[^-0-9]\D+|%/g, '');
    } else {
        return 0;
    }
}

function getSplitValues(value, handle, parseddata) {
    var sub_fields_size = handle.sub_fields.length;
    for (var i = 0; i < sub_fields_size; i++) {
        var regex = handle.sub_fields[i].split_regex;
        var field = handle.name + "_" + handle.sub_fields[i].name;
        var new_value = value.match(regex);
        if (new_value) {
            parseddata[field] = new_value[1];
        } else {
            parseddata[field] = handle.sub_fields[i].default_value;
        }
    }
}

function writeData(data, service) {
    fn = moment().format("YYYYMMDD") + "_" + service + ".sql";
    date_comment = "/* " + moment().format("YYYY/MM/DD HH:mm:ss.SSS") + " */ ";
    fs.appendFileSync(fn, date_comment + "\r\n");
    fs.appendFileSync(fn, data + "\r\n");
}

function parseValue(item, namedarray, handle, parseddata) {
    var ptype = handle.type;
    switch (ptype) {
        case 'split':
            getSplitValues(namedarray[item], handle, parseddata);
            break;
        case 'number':
            parseddata[item] = getNumericValue(namedarray[item]);
            break;
        default:
            parseddata[item] = namedarray[item];
    }
}

function loadDataMySQL(sql_query_param, service) {
    var connection = mysql.createConnection({
        host: app_config.database.host,
        user: app_config.database.username,
        password: app_config.database.password,
        database: app_config.database.schema
    });
    connection.connect(function (err) {
        if (err) {
            app_logger.error('[MySQL] MySQL connecting... ' + err);
            writeData(sql_query_param, service);
            return;
        }
        app_logger.debug('[MySQL] Connected as ID ' + connection.threadId);
    });
    connection.query(sql_query_param, function (error, results, fields) {
        if (error) {
            app_logger.error("[MySQL] Error; Code: " + error.code + " ; Errno: " + error.errno + " ; sqlState: " + error.sqlState + " ;   " + sql_query_param);
            writeData(sql_query_param, service);
        } else {
            app_logger.info('[MySQL] Loading AP Client data: ' + sql_query_param);
        }
    });
    connection.end();
}

function parseBGPData(data_block, host, DateTime) {
    var arrayLength = data_block.length;
    for (var i = 0; i < arrayLength; i++) {
        var parsed_line = {};
        var str = data_block[i];
        var res = str.slice(str.search("name"));
        var res2 = res.match(/([\w\d-_]*)="?([\.\:\w\d_-]*)"?/gi);
        var RESarrayLength = res2.length;
        for (var j = 0; j < RESarrayLength; j++) {
            var test = res2[j].replace(/"/g, "");
            var ress = test.split("=");
            var clean_key = ress[0].replace(/-/g, "_");
            parsed_line[clean_key] = ress[1];
        }
        var bgp_mask_size = app_parsing_masks.bgp.length;
        var newarray = {};
        for (var j = 0; j < bgp_mask_size; j++) {
            var name = app_parsing_masks.bgp[j].name;
            if (!checkProperty(name, parsed_line)) {
                parsed_line[name] = app_parsing_masks.bgp[j].default_value;
            }
            parseValue(name, parsed_line, app_parsing_masks.bgp[j], newarray);
        }
        var sql_fields = "(rdate, host";
        var sql_values = "('" + DateTime + "','" + host + "'";
        var sql_on_update = "";
        var s = 1;
        for (var key in newarray) {
            if (newarray.hasOwnProperty(key)) {
                var val = newarray[key];
                if (s === 1) {
                    sql_on_update += key + "='" + val + "'";
                } else {
                    sql_on_update += "," + key + "='" + val + "'";
                }
                sql_fields += "," + key;
                sql_values += ",'" + val + "'";
                s++;
            }
        }
        sql_fields += ")";
        sql_values += ")";
        var sql_query = "INSERT INTO tbl_base_bgp_peers " + sql_fields + "VALUES" + sql_values + " ON DUPLICATE KEY UPDATE " + sql_on_update + " ;";
        loadDataMySQL(sql_query, "bgp");
    }
}

function parseARPData(data_block, host, DateTime) {
    var arrayLength = data_block.length;
    for (var i = 0; i < arrayLength; i++) {
        var parsed_line = {};
        var str = data_block[i];
        var res = str.slice(str.search("address"));
        var res2 = res.match(/([\w\d-_]*)="?([\.\:\w\d_-]*)"?/gi);
        var RESarrayLength = res2.length;
        for (var j = 0; j < RESarrayLength; j++) {
            var test = res2[j].replace(/"/g, "");
            var ress = test.split("=");
            var clean_key = ress[0].replace(/-/g, "_");
            parsed_line[clean_key] = ress[1];
        }
        var arp_mask_size = app_parsing_masks.arp.length;
        var newarray = {};
        for (var j = 0; j < arp_mask_size; j++) {
            var name = app_parsing_masks.arp[j].name;
            if (!checkProperty(name, parsed_line)) {
                parsed_line[name] = app_parsing_masks.arp[j].default_value;
            }
            parseValue(name, parsed_line, app_parsing_masks.arp[j], newarray);
        }
        var sql_fields = "(rdate, host";
        var sql_values = "('" + DateTime + "','" + host + "'";
        var sql_on_update = "";
        var s = 1;
        for (var key in newarray) {
            if (newarray.hasOwnProperty(key)) {
                var val = newarray[key];
                if (s === 1) {
                    sql_on_update += key + "='" + val + "'";
                } else {
                    sql_on_update += "," + key + "='" + val + "'";
                }
                sql_fields += "," + key;
                sql_values += ",'" + val + "'";
                s++;
            }
        }
        sql_fields += ")";
        sql_values += ")";
        var sql_query = "INSERT INTO tbl_base_ip_arp " + sql_fields + "VALUES" + sql_values + " ON DUPLICATE KEY UPDATE " + sql_on_update + " ;";
        loadDataMySQL(sql_query, "arp");
    }
}


function parseAPClientData(data_block, host, DateTime) {
    var arrayLength = data_block.length;
    for (var i = 0; i < arrayLength; i++) {
        var parsed_line = {};
        var str = data_block[i];
        var res = str.slice(str.search("interface"));
        var res2 = res.match(/([./\w\d-]*="?[./-\w\d\_,:@%\s]*"?)\s/gi);
        var RESarrayLength = res2.length;
        for (var j = 0; j < RESarrayLength; j++) {
            var test = res2[j].replace(/"/g, "");
            var ress = test.split("=");
            var clean_key = ress[0].replace(/[-.]/g, "_");
            var clean_value = ress[1].trim();
            parsed_line[clean_key] = clean_value;
        }
        var ap_client_mask_size = app_parsing_masks.ap_client.length;
        var newarray = {};
        for (var j = 0; j < ap_client_mask_size; j++) {
            var name = app_parsing_masks.ap_client[j].name;
            if (!checkProperty(name, parsed_line)) {
                parsed_line[name] = app_parsing_masks.ap_client[j].default_value;
            }
            parseValue(name, parsed_line, app_parsing_masks.ap_client[j], newarray);
        }
        for (var j = 0; j < ap_client_mask_size; j++) {
            var name = app_parsing_masks.ap_client[j].name;
            if (!checkProperty(name, parsed_line)) {
                parsed_line[name] = app_parsing_masks.ap_client[j].default_value;
            }
            parseValue(name, parsed_line, app_parsing_masks.ap_client[j], newarray);
        }
        var sql_fields = "(rdate, host";
        var sql_values = "('" + DateTime + "','" + host + "'";
        var sql_on_update = "";
        var s = 1;
        for (var key in newarray) {
            if (newarray.hasOwnProperty(key)) {
                var val = newarray[key];
                if (s === 1) {
                    sql_on_update += key + "='" + val + "'";
                } else {
                    sql_on_update += "," + key + "='" + val + "'";
                }
                sql_fields += "," + key;
                sql_values += ",'" + val + "'";
                s++;
            }
        }
        sql_fields += ")";
        sql_values += ")";
        var sql_query = "INSERT INTO tbl_base_ap_clients " + sql_fields + "VALUES" + sql_values + " ON DUPLICATE KEY UPDATE " + sql_on_update + " ;";
        loadDataMySQL(sql_query, "ap_clients");
    }
}

function getBGPRawData(target_ip) {
    var conn = new Client();
    var data_buffer = "";
    var data_buffer2 = [];
    conn.on('ready', function () {
        conn.exec('/routing bgp peer print status where !disabled ', function (err, stream) {
            if (err)
                app_logger.error(err);
            stream.on('close', function (code, signal) {
                conn.end();
                TrigDT = getDateTime();
                data_buffer = data_buffer.substring(data_buffer.indexOf("\n") + 1);
                var paragraphs = data_buffer.split('\r\n\r\n');
                var arrayLength = paragraphs.length;
                for (var i = 0; i < arrayLength; i++) {
                    paragraphs[i] = paragraphs[i].replace(/(?:\r\n|\r|\n)/g, ' ');
                    paragraphs[i] = paragraphs[i].replace(/  +/g, ' ');
                    if (paragraphs[i] !== '') {
                        data_buffer2.push(paragraphs[i]);
                    }
                }
                var strings = data_buffer2;
                if (strings.length > 1) {
                    var string = strings[1].split(" ");
                    var stringArray = new Array();
                    for (var i = 0; i < string.length; i++) {
                        stringArray.push(string[i]);
                        if (i != string.length - 1) {
                            stringArray.push(" ");
                        }
                    }
                }
                parseBGPData(strings, target_ip, TrigDT);
                app_logger.info(target_ip + ' returned ' + strings.length + ' row(s)');
            }).on('data', function (data) {
                data_buffer += data;
            }).stderr.on('data', function (data) {
                app_logger.error(data);
            });
        });
    }).connect({
        host: target_ip,
        port: 22,
        username: app_config.wugms.user,
        privateKey: require('fs').readFileSync(app_config.wugms.ssh_key)
    });
    conn.on('error', function (e) {
        app_logger.error(e);
    });
}

function getAPClientRawData(target_ip) {
    var conn = new Client();
    var data_buffer = "";
    var data_buffer2 = [];
    var s = "";
    conn.on('ready', function () {
        conn.exec('/interface wireless registration-table print stats without-paging detail ', function (err, stream) {
            if (err)
                app_logger.error(err);
            stream.on('close', function (code, signal) {
                conn.end();
                TrigDT = getDateTime();
                if (data_buffer.length > 4) {
                    var paragraphs = data_buffer.split('\r\n\r\n');
                    var arrayLength = paragraphs.length;
                    for (var i = 0; i < arrayLength; i++) {
                        paragraphs[i] = paragraphs[i].replace(/(?:\r\n|\r|\n)/g, ' ');
                        paragraphs[i] = paragraphs[i].replace(/  +/g, ' ');
                        if (paragraphs[i] !== '') {
                            data_buffer2.push(paragraphs[i]);
                        }
                    }
                    var strings = data_buffer2;
                    if (strings.length > 1) {
                        var string = strings[1].split(" ");
                        var stringArray = new Array();
                        for (var i = 0; i < string.length; i++) {
                            stringArray.push(string[i]);
                            if (i !== string.length - 1) {
                                stringArray.push(" ");
                            }
                        }
                    }
                    parseAPClientData(strings, target_ip, TrigDT);
                    app_logger.info(target_ip + ' returned ' + strings.length + ' row(s)');
                } else {
                    app_logger.info(target_ip + ' returned no data.');
                }

            }).on('data', function (data) {
                data_buffer += data;
            }).stderr.on('data', function (data) {
                app_logger.error(data);
            });
        }
        );
    }).connect({
        host: target_ip,
        port: 22,
        username: app_config.wugms.user,
        privateKey: require('fs').readFileSync(app_config.wugms.ssh_key)
    });
    conn.on('error', function (e) {
        app_logger.error(e);
    });
}

function getARPRawData(target_ip) {
    var conn = new Client();
    var data_buffer = "";
    var data_buffer2 = [];
    conn.on('ready', function () {
        conn.exec('/ip arp print terse ', function (err, stream) {
            if (err)
                app_logger.error(err);
            stream.on('close', function (code, signal) {
                conn.end();
                TrigDT = getDateTime();
                var paragraphs = data_buffer.split('\r\n');
                var arrayLength = paragraphs.length;
                for (var i = 0; i < arrayLength; i++) {
                    paragraphs[i] = paragraphs[i].replace(/(?:\r\n|\r|\n)/g, ' ');
                    paragraphs[i] = paragraphs[i].replace(/  +/g, ' ');
                    if (paragraphs[i] !== '') {
                        data_buffer2.push(paragraphs[i]);
                    }
                }
                var strings = data_buffer2;
                if (strings.length > 1) {
                    var string = strings[1].split(" ");
                    var stringArray = new Array();
                    for (var i = 0; i < string.length; i++) {
                        stringArray.push(string[i]);
                        if (i != string.length - 1) {
                            stringArray.push(" ");
                        }
                    }
                }
                parseARPData(strings, target_ip, TrigDT);
                app_logger.info(target_ip + ' returned ' + strings.length + ' row(s)');
            }).on('data', function (data) {
                data_buffer += data;
            }).stderr.on('data', function (data) {
                app_logger.error(data);
            });
        });
    }).connect({
        host: target_ip,
        port: 22,
        username: app_config.wugms.user,
        privateKey: require('fs').readFileSync(app_config.wugms.ssh_key)
    });
    conn.on('error', function (e) {
        app_logger.error(e);
    });
}

http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    var str = request.url;
    var res = str.split("/");
    app_logger.debug(res);
    if (res[1]) {
        switch (res[1]) {
            case 'bgp':
                if (ValidateIPaddress(res[2])) {
                    app_logger.info('Getting BGP Peer information for ' + res[2]);
                    getBGPRawData(res[2]);
                    response.end('Done.');
                } else {
                    app_logger.error('Not a valid address range -> ' + res[2]);
                    response.end('Not a valid address range');
                }
                break;
            case 'ap_clients':
                if (ValidateIPaddress(res[2])) {
                    app_logger.info('Getting AP client information for ' + res[2]);
                    getAPClientRawData(res[2]);
                    response.end('Done.');
                } else {
                    app_logger.error('Not a valid address range -> ' + res[2]);
                    response.end('Not a valid address range');
                }
                break;
            case 'arp':
                if (ValidateIPaddress(res[2])) {
                    app_logger.info('Getting ARP client information for ' + res[2]);
                    getARPRawData(res[2]);
                    response.end('Done.');
                } else {
                    app_logger.error('Not a valid address range -> ' + res[2]);
                    response.end('Not a valid address range');
                }
                break;
            case 'api':
                response.end(' API');
                break;
            default:
                response.end(' Ready for new requests\n');
        }
    } else {
        response.end(' Ready for new requests\n');
    }
}
).listen(app_config.server.port);