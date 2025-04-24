<?php

namespace App\Libraries\ZKTeco;

use Exception;

class ZKLib
{
    private $ip;
    private $port;
    private $socket = null;
    private $protocol = 'UDP';
    private $sessionId = 0;
    private $replyId = 0;
    private $commandId = 0;
    private $connectionState = false;
    private $timeout_sec = 5;
    private $timeout_usec = 500000;
    private $data_recv = '';
    private $attendance = [];
    
    const USHRT_MAX = 65535;
    const CMD_CONNECT = 1000;
    const CMD_EXIT = 1001;
    const CMD_ENABLEDEVICE = 1002;
    const CMD_DISABLEDEVICE = 1003;
    const CMD_RESTART = 1004;
    const CMD_POWEROFF = 1005;
    const CMD_ACK_OK = 2000;
    const CMD_ACK_ERROR = 2001;
    const CMD_ACK_DATA = 2002;
    const CMD_PREPARE_DATA = 1500;
    const CMD_DATA = 1501;
    const CMD_ATTLOG = 1503;
    const CMD_CLEAR_ATTLOG = 1504;
    const CMD_GET_TIME = 1505;
    const CMD_DEVICE = 11;
    const DEVICE_GENERAL_INFO = 1;
    
    public function __construct($ip, $port = 4370, $protocol = 'UDP')
    {
        $this->ip = $ip;
        $this->port = $port;
        $this->protocol = $protocol;
    }
    
    public function setTimeout($sec, $usec)
    {
        $this->timeout_sec = $sec;
        $this->timeout_usec = $usec;
    }
    
    public function connect()
    {
        $command = self::CMD_CONNECT;
        try {
            // Create socket
            if ($this->protocol == 'UDP') {
                $this->socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
            } else {
                $this->socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
            }
            
            if (!$this->socket) {
                throw new Exception('Unable to create socket');
            }
            
            // Set socket options
            socket_set_option($this->socket, SOL_SOCKET, SO_RCVTIMEO, ['sec' => $this->timeout_sec, 'usec' => $this->timeout_usec]);
            socket_set_option($this->socket, SOL_SOCKET, SO_SNDTIMEO, ['sec' => $this->timeout_sec, 'usec' => $this->timeout_usec]);
            
            // Optional: Increase buffer size for some problematic devices
            socket_set_option($this->socket, SOL_SOCKET, SO_RCVBUF, 1024 * 8);
            socket_set_option($this->socket, SOL_SOCKET, SO_SNDBUF, 1024 * 8);
            
            // Connect to device
            if ($this->protocol == 'TCP' && !socket_connect($this->socket, $this->ip, $this->port)) {
                throw new Exception('Unable to connect to device');
            }
            
            // Build and send command
            $buf = $this->createHeader($command, 0, 0);
            
            // Try multiple protocols if needed
            $tryProtocols = ['UDP'];
            if ($this->protocol == 'TCP') {
                $tryProtocols = ['TCP'];
            }
            
            foreach ($tryProtocols as $protocol) {
                try {
                    if ($protocol == 'UDP') {
                        // Send packet with retry
                        $retries = 3;
                        $success = false;
                        
                        while ($retries > 0 && !$success) {
                            $sent = socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
                            if ($sent === false) {
                                $retries--;
                                usleep(500000); // 500ms delay between retries
                                continue;
                            }
                            
                            // Try to receive with a more reliable approach
                            $this->data_recv = '';
                            $from = '';
                            $port = 0;
                            
                            // Set non-blocking mode temporarily for safer receive
                            socket_set_nonblock($this->socket);
                            
                            // Try a few times to get data with short timeouts
                            $receiveAttempts = 5;
                            while ($receiveAttempts > 0) {
                                $received = @socket_recvfrom($this->socket, $tmpData, 1024, 0, $from, $port);
                                if ($received && $received > 0) {
                                    $this->data_recv = $tmpData;
                                    $success = true;
                                    break;
                                }
                                usleep(200000); // 200ms wait
                                $receiveAttempts--;
                            }
                            
                            // Reset to blocking mode
                            socket_set_block($this->socket);
                            
                            if (!$success) {
                                $retries--;
                                usleep(500000); // 500ms delay between retries
                            }
                        }
                    } else {
                        socket_write($this->socket, $buf, strlen($buf));
                        $this->data_recv = socket_read($this->socket, 1024);
                        $success = ($this->data_recv !== false && strlen($this->data_recv) > 0);
                    }
                    
                    if ($success && strlen($this->data_recv) > 0) {
                        // Successful connection
                        $u = unpack('H2h1/H2h2/H2h3/H2h4/H2h5/H2h6/H2h7/H2h8', substr($this->data_recv, 0, 8));
                        $this->sessionId = hexdec($u['h5'] . $u['h6']);
                        $this->connectionState = true;
                        return true;
                    }
                } catch (\Exception $protocolEx) {
                    // Try next protocol if available
                    continue;
                }
            }
            
            // If we get here, none of the protocols worked
            return false;
        } catch (Exception $e) {
            $this->closeSocket();
            throw $e;
        }
    }
    
    public function disconnect()
    {
        if ($this->connectionState) {
            $command = self::CMD_EXIT;
            $buf = $this->createHeader($command);
            
            if ($this->protocol == 'UDP') {
                socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
            } else {
                socket_write($this->socket, $buf, strlen($buf));
            }
            
            $this->connectionState = false;
        }
        
        $this->closeSocket();
        return true;
    }
    
    private function closeSocket()
    {
        if ($this->socket) {
            socket_close($this->socket);
            $this->socket = null;
        }
    }
    
    public function enableDevice()
    {
        if (!$this->connectionState) {
            return false;
        }
        
        $command = self::CMD_ENABLEDEVICE;
        $buf = $this->createHeader($command);
        
        if ($this->protocol == 'UDP') {
            socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
            socket_recvfrom($this->socket, $this->data_recv, 1024, 0, $this->ip, $this->port);
        } else {
            socket_write($this->socket, $buf, strlen($buf));
            $this->data_recv = socket_read($this->socket, 1024);
        }
        
        $u = unpack('H2h1/H2h2', substr($this->data_recv, 0, 2));
        $command = hexdec($u['h2'] . $u['h1']);
        
        return $command == self::CMD_ACK_OK;
    }
    
    public function disableDevice()
    {
        if (!$this->connectionState) {
            return false;
        }
        
        $command = self::CMD_DISABLEDEVICE;
        $buf = $this->createHeader($command);
        
        if ($this->protocol == 'UDP') {
            socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
            socket_recvfrom($this->socket, $this->data_recv, 1024, 0, $this->ip, $this->port);
        } else {
            socket_write($this->socket, $buf, strlen($buf));
            $this->data_recv = socket_read($this->socket, 1024);
        }
        
        $u = unpack('H2h1/H2h2', substr($this->data_recv, 0, 2));
        $command = hexdec($u['h2'] . $u['h1']);
        
        return $command == self::CMD_ACK_OK;
    }
    
    public function getAttendance()
    {
        if (!$this->connectionState) {
            return false;
        }
        
        $command = self::CMD_ATTLOG;
        $buf = $this->createHeader($command);
        
        if ($this->protocol == 'UDP') {
            socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
            socket_recvfrom($this->socket, $this->data_recv, 1024, 0, $this->ip, $this->port);
        } else {
            socket_write($this->socket, $buf, strlen($buf));
            $this->data_recv = socket_read($this->socket, 1024);
        }
        
        $u = unpack('H2h1/H2h2', substr($this->data_recv, 0, 2));
        $command = hexdec($u['h2'] . $u['h1']);
        
        if ($command == self::CMD_PREPARE_DATA) {
            $size = unpack('H2h1/H2h2/H2h3/H2h4', substr($this->data_recv, 8, 4));
            $size = hexdec($size['h4'] . $size['h3'] . $size['h2'] . $size['h1']);
            
            $data = '';
            while (strlen($data) < $size) {
                $buf = $this->createHeader(self::CMD_DATA);
                
                if ($this->protocol == 'UDP') {
                    socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
                    socket_recvfrom($this->socket, $this->data_recv, 1024, 0, $this->ip, $this->port);
                } else {
                    socket_write($this->socket, $buf, strlen($buf));
                    $this->data_recv = socket_read($this->socket, 1024);
                }
                
                $data .= substr($this->data_recv, 8);
            }
            
            // Parse attendance data
            return $this->parseAttendanceData($data, $size);
        }
        
        return false;
    }
    
    private function parseAttendanceData($data, $size)
    {
        $attendance = [];
        $record_size = 40; // Most devices use 40-byte records
        
        for ($i = 0; $i < $size; $i += $record_size) {
            if ($i + $record_size <= $size) {
                $record = array_slice(unpack('C*', substr($data, $i, $record_size)), 0);
                
                $user_id = '';
                foreach (array_slice($record, 0, 9) as $char) {
                    if ($char != 0) $user_id .= chr($char);
                }
                $user_id = trim($user_id);
                
                $timestamp = $this->decodeTime(array_slice($record, 24, 4));
                $status = $record[28];
                $type = $record[29]; // Usually represents in/out mode
                
                $attendance[] = [
                    'id' => $user_id,
                    'timestamp' => $timestamp,
                    'status' => $status,
                    'type' => $type,
                ];
            }
        }
        
        return $attendance;
    }
    
    private function decodeTime($bytes)
    {
        $year = hexdec(sprintf('%02x%02x', $bytes[1], $bytes[0]));
        $month = hexdec(sprintf('%02x', $bytes[2]));
        $day = hexdec(sprintf('%02x', $bytes[3]));
        $hour = 0;
        $minute = 0;
        $second = 0;
        
        if (count($bytes) >= 7) {
            $hour = hexdec(sprintf('%02x', $bytes[4]));
            $minute = hexdec(sprintf('%02x', $bytes[5]));
            $second = hexdec(sprintf('%02x', $bytes[6]));
        }
        
        return sprintf('%04d-%02d-%02d %02d:%02d:%02d', $year, $month, $day, $hour, $minute, $second);
    }
    
    public function clearAttendance()
    {
        if (!$this->connectionState) {
            return false;
        }
        
        $command = self::CMD_CLEAR_ATTLOG;
        $buf = $this->createHeader($command);
        
        if ($this->protocol == 'UDP') {
            socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
            socket_recvfrom($this->socket, $this->data_recv, 1024, 0, $this->ip, $this->port);
        } else {
            socket_write($this->socket, $buf, strlen($buf));
            $this->data_recv = socket_read($this->socket, 1024);
        }
        
        $u = unpack('H2h1/H2h2', substr($this->data_recv, 0, 2));
        $command = hexdec($u['h2'] . $u['h1']);
        
        return $command == self::CMD_ACK_OK;
    }
    
    public function getDeviceName()
    {
        return $this->getDeviceInfo(self::DEVICE_GENERAL_INFO, 'name');
    }
    
    public function getSerialNumber()
    {
        return $this->getDeviceInfo(self::DEVICE_GENERAL_INFO, 'serialNumber');
    }
    
    public function getPlatform()
    {
        return $this->getDeviceInfo(self::DEVICE_GENERAL_INFO, 'platform');
    }
    
    public function getFirmwareVersion()
    {
        return $this->getDeviceInfo(self::DEVICE_GENERAL_INFO, 'firmwareVersion');
    }
    
    public function getMac()
    {
        $mac = $this->getDeviceInfo(self::DEVICE_GENERAL_INFO, 'mac');
        return $mac ? preg_replace('/(.{2})/', '$1:', $mac) : '';
    }
    
    private function getDeviceInfo($command_type, $field = null)
    {
        if (!$this->connectionState) {
            return false;
        }
        
        $command = self::CMD_DEVICE;
        $buf = $this->createHeader($command, 0, $command_type);
        
        if ($this->protocol == 'UDP') {
            socket_sendto($this->socket, $buf, strlen($buf), 0, $this->ip, $this->port);
            socket_recvfrom($this->socket, $this->data_recv, 1024, 0, $this->ip, $this->port);
        } else {
            socket_write($this->socket, $buf, strlen($buf));
            $this->data_recv = socket_read($this->socket, 1024);
        }
        
        $u = unpack('H2h1/H2h2', substr($this->data_recv, 0, 2));
        $command = hexdec($u['h2'] . $u['h1']);
        
        if ($command == self::CMD_ACK_OK) {
            $data = substr($this->data_recv, 8);
            // Parse device info response
            // Since each model returns slightly different format, we'll return a generic response
            return 'Device Info Available';
        }
        
        return false;
    }
    
    public function setCommPassword($password)
    {
        // Implement if your specific ZKTeco device requires a communication password
        return true;
    }
    
    private function createHeader($command, $chksum = 0, $session_id = 0, $reply_id = 0)
    {
        if ($session_id === 0) {
            $session_id = $this->sessionId;
        }
        
        if ($reply_id === 0) {
            $reply_id = $this->replyId;
        }
        
        $buf = pack('SSSS', $command, $chksum, $session_id, $reply_id);
        $this->commandId = $command;
        
        return $buf;
    }
    
    public function calcCheckSum($p)
    {
        $l = count($p);
        $chksum = 0;
        
        for ($i = 0; $i < $l; $i++) {
            $chksum += $p[$i];
        }
        
        $chksum = $chksum % self::USHRT_MAX;
        
        return $chksum;
    }
}